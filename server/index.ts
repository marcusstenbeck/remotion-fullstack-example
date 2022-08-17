import express from 'express';
import path from 'path';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/renders', express.static('renders'));

app.get('/', (req, res) => {
  res.json({ message: 'Test' });
});

app.get('/render', async (req, res) => {
  // this sets timeout to 60 seconds
  req.setTimeout(60 * 1000);

  // The composition you want to render
  const compositionId = 'HelloWorld';

  // You only have to do this once, you can reuse the bundle.
  const entry = './src/remotion/index';
  console.log('Creating a Webpack bundle of the video');
  const bundleLocation = await bundle(path.resolve(entry), () => undefined, {
    // If you have a Webpack override, make sure to add it here
    webpackOverride: (config) => config,
  });

  // Parametrize the video by passing arbitrary props to your component.
  const inputProps = req.query;

  // Extract all the compositions you have defined in your project
  // from the webpack bundle.
  const comps = await getCompositions(bundleLocation, {
    // You can pass custom input props that you can retrieve using getInputProps()
    // in the composition list. Use this if you want to dynamically set the duration or
    // dimensions of the video.
    inputProps,
  });

  // Select the composition you want to render.
  const composition = comps.find((c) => c.id === compositionId);

  // Ensure the composition exists
  if (!composition) {
    throw new Error(`No composition with the ID ${compositionId} found.
 Review "${entry}" for the correct ID.`);
  }

  const fileName = `${compositionId}-${Date.now()}.mp4`;
  const outputLocation = path.resolve('./renders', fileName);

  console.log('Attempting to render:', outputLocation);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation,
    inputProps,

    onBrowserLog: (log) => {
      // `type` is the console.* method: `log`, `warn`, `error`, etc.
      console.log(`[${log.type}]\n${log.text}\nat ${log.stackTrace}`);
    },

    onStart: (props) => {
      console.log(`Beginning to render ${props.frameCount}.`);
    },

    onProgress: ({ renderedFrames, encodedFrames, encodedDoneIn, renderedDoneIn, stitchStage }) => {
      if (stitchStage === 'encoding') {
        // First pass, parallel rendering of frames and encoding into video
        console.log('Encoding...');
      } else if (stitchStage === 'muxing') {
        // Second pass, adding audio to the video
        console.log('Muxing audio...');
      }
      // Amount of frames rendered into images
      console.log(`${renderedFrames} rendered`);
      // Amount of frame encoded into a video
      console.log(`${encodedFrames} encoded`);
      // Time to create images of all frames
      if (renderedDoneIn !== null) {
        console.log(`Rendered in ${renderedDoneIn}ms`);
      }
      // Time to encode video from images
      if (encodedDoneIn !== null) {
        console.log(`Encoded in ${encodedDoneIn}ms`);
      }
    },

    onDownload: (src) => {
      console.log(`Downloading ${src}...`);
      return ({ percent, downloaded, totalSize }) => {
        // percent and totalSize can be `null` if the downloaded resource
        // does not have a `Content-Length` header
        if (percent === null) {
          console.log(`${downloaded} bytes downloaded`);
        } else {
          console.log(`${Math.round(percent * 100)}% done)`);
        }
      };
    },
  });
  console.log('Render done!');

  res.json({ location: `//localhost:3001/renders/${fileName}` });
});

app.listen(3001, () => {
  console.log('API Server listening on http://localhost:3001');
});

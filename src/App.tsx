import { Player } from '@remotion/player';
import { useState } from 'react';
import { HelloWorld } from './remotion/HelloWorld';
import './styles.css';

export default function App() {
  const [foo, setFoo] = useState('bar');
  const [status, setStatus] = useState('not-rendering');
  const [url, setUrl] = useState('');

  return (
    <div className="App">
      <div style={{ margin: '0 auto' }}>
        <p>Remotion preview</p>
        <Player
          className="__player"
          style={{
            height: 320,
            margin: '0 auto',
          }}
          component={HelloWorld}
          durationInFrames={120}
          compositionWidth={1920}
          compositionHeight={1080}
          fps={30}
          loop
          autoPlay
          controls
          inputProps={{ foo }}
        />
      </div>
      <div>
        <input
          type="text"
          value={foo}
          onChange={(e) => {
            setFoo(e.target.value);
          }}
        />
      </div>
      <div>
        <button
          role="button"
          disabled={status === 'rendering'}
          onClick={async () => {
            setUrl('');
            setStatus('rendering');
            try {
              const { location } = await fetch(`//localhost:3001/render?foo=${foo}`).then((r) =>
                r.json()
              );
              setUrl(location);
            } catch (e) {}
            setStatus('not-rendering');
          }}>
          Render
        </button>
      </div>

      {url && (
        <div>
          <p>Rendered video</p>
          <video style={{ width: 320, margin: '0 auto' }} controls autoPlay loop src={url} />
        </div>
      )}
    </div>
  );
}

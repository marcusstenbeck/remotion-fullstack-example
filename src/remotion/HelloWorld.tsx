import React from 'react';
import { useCurrentFrame } from 'remotion';

export const HelloWorld: React.FC<{ foo: string }> = ({ foo }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        backgroundColor: 'lightblue',
        flex: 1,
        textAlign: 'center',
        fontSize: '7em',
      }}>
      <p>foo: {foo}</p>
      <p>The current frame is {frame}.</p>
    </div>
  );
};

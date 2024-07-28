// src/pages/index.tsx

import { useEffect } from 'react';

const IndexPage = () => {
  useEffect(() => {
    console.log('Spotify Token:', process.env.NEXT_PUBLIC_SPOTIFY_TOKEN);
  }, []);

  return (
    <div>
      <h1>Home Page</h1>
    </div>
  );
};

export default IndexPage;

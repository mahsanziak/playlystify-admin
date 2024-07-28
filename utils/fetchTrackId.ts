import fetch from 'isomorphic-unfetch';

const fetchTrackId = async (song: string, artist: string, token: string): Promise<string | null> => {
  const response = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(song)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (data.tracks.items.length > 0) {
    return data.tracks.items[0].id;
  } else {
    console.error('No track found for', song, artist);
    return null;
  }
};

export default fetchTrackId;

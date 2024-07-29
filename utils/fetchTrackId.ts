// fetchTrackId.ts
import fetch from 'isomorphic-unfetch';

interface TrackInfo {
  id: string | null;
  thumbnail: string | null;
}

const fetchTrackId = async (song: string, artist: string, token: string): Promise<TrackInfo> => {
  const response = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(song)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (data.tracks.items.length > 0) {
    const track = data.tracks.items[0];
    return {
      id: track.id,
      thumbnail: track.album.images[0].url
    };
  } else {
    console.error('No track found for', song, artist);
    return { id: null, thumbnail: null };
  }
};

export default fetchTrackId;

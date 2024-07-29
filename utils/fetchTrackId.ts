import fetch from 'isomorphic-unfetch';

const fetchTrackId = async (song: string, artist: string, token: string): Promise<{ id: string, thumbnail: string }> => {
  const response = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(song)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (data.tracks.items.length > 0) {
    const track = data.tracks.items[0];
    const thumbnail = track.album.images[0]?.url || 'https://via.placeholder.com/150';
    return { id: track.id, thumbnail };
  } else {
    console.error('No track found for', song, artist);
    return { id: '', thumbnail: 'https://via.placeholder.com/150' };
  }
};

export default fetchTrackId;

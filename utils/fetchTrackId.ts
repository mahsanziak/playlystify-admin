// utils/fetchTrackId.ts
import { supabase } from './supabaseClient';

const fetchTrackId = async (song: string, artist: string, showId: string): Promise<{ id: string, thumbnail: string }> => {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  // Fetch the latest access token and refresh token from Supabase
  const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .select('access_token, refresh_token')
    .eq('show_id', showId)
    .single();

  if (tokenError || !tokenData) {
    console.error('Error fetching tokens:', tokenError);
    throw new Error('Could not fetch tokens');
  }

  accessToken = tokenData.access_token;
  refreshToken = tokenData.refresh_token;

  const fetchToken = async () => {
    const response = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(song)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 401) {
      // Access token expired, refresh it
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/refreshToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken, showId })
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error('Error refreshing token:', errorText);
        throw new Error(`Could not refresh access token: ${errorText}`);
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      return await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(song)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    }

    return response;
  };

  const response = await fetchToken();
  const searchData = await response.json();

  if (searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
    const track = searchData.tracks.items[0];
    const thumbnail = track.album.images[0]?.url || 'https://via.placeholder.com/150';
    return { id: track.id, thumbnail };
  } else {
    console.error('No track found for', song, artist);
    return { id: '', thumbnail: 'https://via.placeholder.com/150' };
  }
};

export default fetchTrackId;

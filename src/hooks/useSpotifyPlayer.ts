import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const useSpotifyPlayer = (showId: string) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const { data, error } = await supabase
        .from('tokens')
        .select('access_token, refresh_token')
        .eq('show_id', showId)
        .single();

      if (error || !data) {
        console.error('Error fetching access token:', error);
        return;
      }

      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
    };

    fetchToken();
  }, [showId]);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player({
        name: 'Restaurant Music Player',
        getOAuthToken: (cb) => { cb(token); },
        volume: 0.5,
      });

      player.addListener('ready', (data) => {
        setDeviceId(data.device_id);
        setIsReady(true);
      });

      player.addListener('not_ready', (data) => {
        setIsReady(false);
      });

      player.addListener('player_state_changed', (state) => {
        console.log('Player state changed', state);
      });

      player.connect();
      setPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [token]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (refreshToken && showId) {
        console.log('Attempting to refresh token with refreshToken:', refreshToken);
        const response = await fetch('/api/refreshToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken, showId }),
        });

        if (response.ok) {
          const { access_token, refresh_token } = await response.json();
          console.log('New access token:', access_token);
          console.log('New refresh token:', refresh_token);
          setToken(access_token);
          setRefreshToken(refresh_token);

          // Update tokens in Supabase
          const { error } = await supabase
            .from('tokens')
            .update({ access_token, refresh_token })
            .eq('show_id', showId);

          if (error) {
            console.error('Error updating tokens in Supabase:', error);
          } else {
            console.log('Updated tokens in Supabase');
          }
        } else {
          console.error('Error refreshing token');
        }
      }
    }, 6000); // Refresh every 6 seconds for testing

    return () => clearInterval(interval);
  }, [refreshToken, showId]);

  return { player, deviceId, isReady };
};

export default useSpotifyPlayer;

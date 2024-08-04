import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const useSpotifyPlayer = (showId: string) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const isDeviceState = (state: any): state is { device_id: string } => {
    return (state as { device_id: string }).device_id !== undefined;
  };

  useEffect(() => {
    const fetchToken = async () => {
      const { data, error } = await supabase
        .from('tokens')
        .select('access_token')
        .eq('show_id', showId)
        .single();

      if (error || !data) {
        console.error('Error fetching access token:', error);
        return;
      }

      setToken(data.access_token);
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
        if (isDeviceState(data)) {
          setDeviceId(data.device_id);
          setIsReady(true);
          console.log('Ready with Device ID', data.device_id);
        }
      });

      player.addListener('not_ready', (data) => {
        if (isDeviceState(data)) {
          setIsReady(false);
          console.log('Device ID has gone offline', data.device_id);
        }
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

  return { player, deviceId, isReady };
};

export default useSpotifyPlayer;

// src/hooks/useSpotifyPlayer.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const useSpotifyPlayer = (showId: string) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const isDeviceState = (state: any): state is { device_id: string } => {
    return (state as { device_id: string }).device_id !== undefined;
  };

  useEffect(() => {
    const fetchTokens = async () => {
      const { data, error } = await supabase
        .from('tokens')
        .select('access_token, refresh_token')
        .eq('show_id', showId)
        .single();

      if (error || !data) {
        console.error('Error fetching tokens:', error);
        return;
      }

      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      console.log(`Fetched tokens: access_token=${data.access_token}, refresh_token=${data.refresh_token}`);

      // Set an interval to refresh the token every 55 seconds
      const intervalId = setInterval(() => {
        refreshAccessToken(data.refresh_token);
      }, 55000); // 55000 milliseconds = 55 seconds

      return () => clearInterval(intervalId); // Cleanup the interval on component unmount
    };

    fetchTokens();
  }, [showId]);

  const refreshAccessToken = async (refreshToken: string) => {
    const refreshTokenUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/refreshToken`;
    const response = await fetch(refreshTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken, showId })
    });

    if (!response.ok) {
      console.error('Error refreshing token:', await response.text());
      return;
    }

    const refreshData = await response.json();
    setToken(refreshData.access_token);
    setRefreshToken(refreshData.refresh_token);
    console.log(`Refreshed tokens: access_token=${refreshData.access_token}, refresh_token=${refreshData.refresh_token}`);
  };

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

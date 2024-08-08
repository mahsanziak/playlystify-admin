// pages/api/testRefreshToken.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../utils/supabaseClient';
import axios, { AxiosError } from 'axios';

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

const refreshTokens = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { data, error } = await supabase
      .from('tokens')
      .select('show_id, refresh_token');

    if (error) {
      console.error('Error fetching tokens from Supabase:', error);
      res.status(500).json({ error: 'Error fetching tokens from Supabase' });
      return;
    }

    if (!data || data.length === 0) {
      console.log('No tokens found');
      res.status(200).json({ message: 'No tokens found' });
      return;
    }

    for (const { show_id, refresh_token } of data) {
      if (!refresh_token) {
        console.error('No refresh token found for show_id:', show_id);
        continue;
      }

      console.log(`Attempting to refresh token for show_id=${show_id}`);

      try {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token,
        }).toString(), {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (response.status === 200) {
          const { access_token, refresh_token: new_refresh_token } = response.data;
          console.log(`Successfully refreshed tokens for show_id=${show_id}: access_token=${access_token}, refresh_token=${new_refresh_token}`);

          const { error } = await supabase
            .from('tokens')
            .update({ access_token, refresh_token: new_refresh_token })
            .eq('show_id', show_id);

          if (error) {
            console.error('Error updating tokens in Supabase for show_id:', show_id, error);
          } else {
            console.log('Updated tokens in Supabase for show_id:', show_id);
          }
        } else {
          console.error('Error refreshing token for show_id:', show_id, response.data);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error refreshing token for show_id:', show_id, error.response?.data || error.message);
        } else {
          console.error('Error refreshing token for show_id:', show_id, (error as Error).message);
        }
      }
    }

    res.status(200).json({ message: 'Token refresh process completed' });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error during the token refresh process:', error.response?.data || error.message);
      res.status(500).json({ error: 'Internal server error', details: error.response?.data || error.message });
    } else {
      console.error('Error during the token refresh process:', (error as Error).message);
      res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
    }
  }
};

export default refreshTokens;

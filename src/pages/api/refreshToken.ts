// pages/api/refreshToken.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../utils/supabaseClient';
import axios from 'axios';

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { refreshToken, showId } = req.body;

  if (!refreshToken || !showId) {
    res.status(400).json({ error: 'Refresh token and show ID are required' });
    return;
  }

  console.log(`Received request to refresh token: refresh_token=${refreshToken}, show_id=${showId}`);

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(), {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.status === 200) {
      const { access_token, refresh_token } = response.data;
      console.log(`Successfully refreshed tokens: access_token=${access_token}, refresh_token=${refresh_token}`);

      // Update the access and refresh tokens in Supabase
      const { error } = await supabase
        .from('tokens')
        .update({ access_token, refresh_token })
        .eq('show_id', showId);

      if (error) {
        console.error('Error updating tokens in Supabase:', error);
        res.status(500).json({ error: 'Error updating tokens' });
        return;
      }

      console.log(`Updated tokens in Supabase for show_id: ${showId}`);

      res.status(200).json({ access_token, refresh_token });
    } else {
      console.error('Error refreshing token:', response.data);
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error refreshing tokens:', error.response?.data || error.message);
      res.status(500).json({ error: 'Internal server error', details: error.response?.data || error.message });
    } else {
      console.error('Unexpected error refreshing tokens:', error);
      res.status(500).json({ error: 'Internal server error', details: String(error) });
    }
  }
};

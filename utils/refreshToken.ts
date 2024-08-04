import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../utils/supabaseClient';
import axios from 'axios';

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { refreshToken, showId } = req.body;

  if (!refreshToken || !showId) {
    res.status(400).json({ error: 'Refresh token and show ID are required' });
    return;
  }

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
      const { access_token } = response.data;

      // Update the access token in Supabase
      const { error } = await supabase
        .from('tokens')
        .update({ access_token })
        .eq('show_id', showId);

      if (error) {
        console.error('Error updating access token:', error);
        res.status(500).json({ error: 'Error updating access token' });
        return;
      }

      res.status(200).json({ access_token });
    } else {
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import { NextApiRequest, NextApiResponse } from 'next';

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const code = req.query.code;

  if (!code || Array.isArray(code)) {
    res.status(400).json({ error: 'Invalid code' });
    return;
  }

  const authOptions = {
    code: code as string,
    redirect_uri,
    grant_type: 'authorization_code',
    client_id,
    client_secret,
  };

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`,
    },
    body: new URLSearchParams(authOptions as Record<string, string>),
  });

  const data = await response.json();
  if (response.status === 200) {
    res.redirect(`/?access_token=${data.access_token}`);
  } else {
    res.status(response.status).json(data);
  }
};

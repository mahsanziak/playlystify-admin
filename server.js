const express = require('express');
const request = require('request');
const querystring = require('querystring');
const app = express();
const cors = require('cors'); // Import cors module


const client_id = 'e0363b44641543f28e7815877171d542'; // Your client id
const client_secret = 'd856842b0a8f4e87a07e35894a7ef6e1'; // Your client secret
const redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

let refreshToken = ''; // This should be stored securely and managed properly

app.use(cors()); // Add this line to handle CORS

app.get('/login', function(req, res) {
  const scope = 'playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
});

app.get('/callback', function(req, res) {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      refreshToken = body.refresh_token;
      res.send({
        'Access Token': access_token,
        'Refresh Token': refreshToken
      });
    } else {
      res.send({
        'Error': 'Invalid token'
      });
    }
  });
});

app.get('/refresh_token', function(req, res) {
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({
        'Access Token': access_token
      });
    } else {
      res.send({
        'Error': 'Failed to refresh token'
      });
    }
  });
});

app.listen(8888, () => {
  console.log('Server is running on port 8888');
});
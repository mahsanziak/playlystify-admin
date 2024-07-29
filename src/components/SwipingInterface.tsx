import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import fetchTrackId from '../../utils/fetchTrackId';
import TinderCard from 'react-tinder-card';

type Request = {
  id: string;
  show_id: string;
  artist: string;
  song: string;
  thumbnail: string | null; // Allow thumbnail to be nullable
  dedication?: string;
  status?: string;
  created_at: string;
};

const SwipingInterface: React.FC<{ showId: string; code: string; token: string }> = ({ showId, code, token }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('show_id', showId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching song requests:', error);
      } else {
        const requestsWithThumbnails = await Promise.all(data.map(async (request: Request) => {
          const trackInfo = await fetchTrackId(request.song, request.artist, token);
          return {
            ...request,
            thumbnail: trackInfo.thumbnail || 'https://via.placeholder.com/150' // Provide a default thumbnail if null
          };
        }));
        setRequests(requestsWithThumbnails);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [showId, token]);

  const onSwipe = async (direction: string, request: Request) => {
    if (direction === 'right') {
      const trackInfo = await fetchTrackId(request.song, request.artist, token);
      if (!trackInfo.id) {
        alert('Could not find track on Spotify');
        return;
      }
      const trackUri = `spotify:track:${trackInfo.id}`;
      const playlistId = '56eZf25Jow0s4brTYx2mCb';

      // Validate the track ID format (base62)
      const isValidBase62 = /^[0-9A-Za-z]+$/.test(trackInfo.id);
      if (!isValidBase62) {
        alert('Invalid track ID format');
        return;
      }

      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
          method: 'POST',
          body: JSON.stringify({ uris: [trackUri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          console.error('Error adding track to playlist:', data);
          alert(`Error adding track to playlist: ${data.error.message}`);
        } else {
          console.log('Track added to playlist:', data);
        }
      } catch (error) {
        console.error('Error adding track to playlist:', error);
        alert('Error adding track to playlist. Check the console for more details.');
      }
    }
    // Remove the song from the list regardless of swipe direction
    setRequests((prevRequests) => prevRequests.filter((r) => r.id !== request.id));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (requests.length === 0) {
    return <div>No song requests found for this show.</div>;
  }

  return (
    <div className="swipe-container">
      {requests.map((request) => (
        <TinderCard
          className="swipe"
          key={request.id}
          onSwipe={(dir) => onSwipe(dir, request)}
        >
          <div className="card">
            <img src={request.thumbnail || 'https://via.placeholder.com/150'} alt={`${request.artist} - ${request.song}`} />
            <h3>{request.song}</h3>
            <p>{request.artist}</p>
          </div>
        </TinderCard>
      ))}
    </div>
  );
};

export default SwipingInterface;

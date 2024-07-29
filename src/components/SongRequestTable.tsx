import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import fetchTrackId from '../../utils/fetchTrackId';

// Define the structure of a request
type Request = {
  id: string;
  show_id: string;
  artist: string;
  song: string; // This is the song title
  dedication?: string;
  status?: string;
  created_at: string;
};

const tableStyle: React.CSSProperties = {
  minWidth: '100%',
  backgroundColor: '#2c2c2c',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
  marginTop: '24px',
};

const thStyle: React.CSSProperties = {
  padding: '16px',
  textAlign: 'left',
  backgroundColor: '#1f1f1f',
  color: '#f1f1f1',
};

const tdStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #444',
  color: '#f1f1f1',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '4px',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  border: 'none',
};

const editButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#3b82f6',
  marginRight: '8px',
};

const deleteButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ef4444',
};

const toggleButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#10b981',
  marginBottom: '16px',
};

const SongRequestTable: React.FC<{ showId: string; code: string; token: string }> = ({ showId, code, token }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('show_id', showId)
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (error) {
        console.error('Error fetching song requests:', error);
      } else {
        setRequests(data as Request[]);
      }
      setLoading(false);
    };

    fetchRequests();

    const channel = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests', filter: `show_id=eq.${showId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prev) =>
              sortOrder === 'asc' ? [...prev, payload.new as Request] : [payload.new as Request, ...prev]
            );
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((request) =>
                request.id === (payload.new as Request).id ? (payload.new as Request) : request
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prev) => prev.filter((request) => request.id !== (payload.old as Request).id));
          }
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showId, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const addToPlaylist = async (song: string, artist: string, requestId: string) => {
    const playlistId = '56eZf25Jow0s4brTYx2mCb'; // Your Spotify playlist ID

    if (!token) {
      alert('Spotify token is not available');
      return;
    }

    const trackInfo = await fetchTrackId(song, artist, token);

    if (!trackInfo.id) {
      alert('Could not find track on Spotify');
      return;
    }

    const trackUri = `spotify:track:${trackInfo.id}`;

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
        // Remove the song from the list
        setRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));
      }
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      alert('Error adding track to playlist. Check the console for more details.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (requests.length === 0) {
    return <div>No song requests found for this show.</div>;
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '24px' }}>
      <button style={toggleButtonStyle} onClick={toggleSortOrder}>
        Toggle Sort Order ({sortOrder === 'asc' ? 'Newest First' : 'Oldest First'})
      </button>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Artist</th>
            <th style={thStyle}>Song</th>
            <th style={thStyle}>Dedication</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td style={tdStyle}>{request.artist}</td>
              <td style={tdStyle}>{request.song}</td> {/* This should be the song title */}
              <td style={tdStyle}>{request.dedication}</td>
              <td style={tdStyle}>{request.status}</td>
              <td style={tdStyle}>
                <button style={editButtonStyle}>Edit</button>
                <button style={deleteButtonStyle}>Delete</button>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#1DB954' }}
                  onClick={() => addToPlaylist(request.song, request.artist, request.id)}
                >
                  Add to Playlist
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SongRequestTable;

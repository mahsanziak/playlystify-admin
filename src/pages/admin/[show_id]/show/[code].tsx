import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import SongRequestTable from '../../../../components/SongRequestTable';
import { supabase } from '../../../../../utils/supabaseClient';
import fetchTrackId from '../../../../../utils/fetchTrackId';

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#1e1e1e',
  color: '#f1f1f1',
};

const mainStyle: React.CSSProperties = {
  flex: '1',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const headingStyle: React.CSSProperties = {
  fontSize: '32px',
  marginBottom: '16px',
  fontWeight: '700',
  color: '#4caf50',
  fontFamily: 'Montserrat, sans-serif', // Applied Montserrat font
  textAlign: 'center',
};

const listContainerStyle: React.CSSProperties = {
  width: '100%',
};

type Request = {
  id: string;
  show_id: string;
  artist: string;
  song: string;
  thumbnail: string | null;
  dedication?: string;
  status?: string;
  created_at: string;
};

const ShowPage: React.FC = () => {
  const router = useRouter();
  const { show_id, code } = router.query;
  const [showName, setShowName] = useState<string | null>(null);
  const [validShow, setValidShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(process.env.NEXT_PUBLIC_SPOTIFY_TOKEN || null);
  const [requests, setRequests] = useState<Request[]>([]);

  useEffect(() => {
    const validateShow = async () => {
      if (show_id && code) {
        const { data, error } = await supabase
          .from('shows')
          .select('id, code, name')
          .eq('id', show_id)
          .eq('code', code)
          .single();

        if (data) {
          setValidShow(true);
          setShowName(data.name);
        } else {
          console.error('Invalid show_id or code:', error);
          setValidShow(false);
        }
        setLoading(false);
      }
    };

    const fetchRequests = async () => {
      if (show_id && code && token) {
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('show_id', show_id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching song requests:', error);
        } else {
          const requestsWithThumbnails = await Promise.all(data.map(async (request: Request) => {
            const trackInfo = await fetchTrackId(request.song, request.artist, token!);
            return {
              ...request,
              thumbnail: trackInfo.thumbnail || 'https://via.placeholder.com/150'
            };
          }));
          setRequests(requestsWithThumbnails);
        }
      }
    };

    validateShow();
    fetchRequests();

    const channel = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests', filter: `show_id=eq.${show_id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prevRequests) => [...prevRequests, payload.new as Request]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prevRequests) =>
              prevRequests.map((request) =>
                request.id === (payload.new as Request).id ? (payload.new as Request) : request
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests((prevRequests) => prevRequests.filter((request) => request.id !== (payload.old as Request).id));
          }
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [show_id, code, token]);

  const addToQueue = async (song: string, artist: string, requestId: string) => {
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

  const deleteRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting request:', error);
    } else {
      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '32px' }}>Loading...</div>;
  }

  if (!validShow) {
    return (
      <div style={pageStyle}>
        <Header isMobileView={false} toggleView={function (): void {
          throw new Error('Function not implemented.');
        } } />
        <main style={mainStyle}>
          <h2 style={{ ...headingStyle, color: '#ef4444' }}>Invalid Show ID or Code</h2>
          <p>Please check the URL and try again.</p>
        </main>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Header isMobileView={false} toggleView={function (): void {
        throw new Error('Function not implemented.');
      } } />
      <main style={mainStyle}>
        {showName && <h1 style={headingStyle}>{showName}</h1>}
        <div style={listContainerStyle}>
          <SongRequestTable requests={requests} token={token!} addToQueue={addToQueue} deleteRequest={deleteRequest} />
        </div>
      </main>
    </div>
  );
};

export default ShowPage;

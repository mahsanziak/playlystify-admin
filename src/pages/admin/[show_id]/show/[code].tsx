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
  background: 'linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3)), url(/path-to-your-background-image.jpg) no-repeat center center fixed',
  backgroundSize: 'cover',
  color: '#f1f1f1',
  fontFamily: '"SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontWeight: 300,
};

const mainStyle: React.CSSProperties = {
  flex: '1',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const headingStyle: React.CSSProperties = {
  fontSize: '24px',
  marginBottom: '16px',
  fontWeight: '700',
  color: '#ffffff',
  textAlign: 'center',
};

const listContainerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  gap: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '20px',
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
  gap: '10px',
  color: '#ffffff',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#ff4c4c',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  border: 'none',
  borderRadius: '8px',
  marginBottom: '16px',
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

const ShowPage: React.FC<{ initialRequests: Request[], showName: string, token: string }> = ({ initialRequests, showName, token }) => {
  const router = useRouter();
  const { show_id } = router.query;
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [autoplay, setAutoplay] = useState(false); // State for autoplay
  const [processedRequests, setProcessedRequests] = useState<Set<string>>(new Set()); // Track processed requests by ID

  useEffect(() => {
    const fetchAutoplay = async () => {
      const { data, error } = await supabase
        .from('shows')
        .select('autoplay')
        .eq('id', show_id)
        .single();

      if (error) {
        console.error('Error fetching autoplay state:', error);
      } else {
        setAutoplay(data.autoplay);
      }
    };

    fetchAutoplay();
  }, [show_id]);

  const toggleAutoplay = async () => {
    const newAutoplayValue = !autoplay;
    setAutoplay(newAutoplayValue);

    const { error } = await supabase
      .from('shows')
      .update({ autoplay: newAutoplayValue })
      .eq('id', show_id);

    if (error) {
      console.error('Error updating autoplay:', error);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('show_id', show_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching song requests:', error);
      } else {
        const requestsWithThumbnails = await Promise.all(data.map(async (request: Request) => {
          const trackInfo = await fetchTrackId(request.song, request.artist, show_id as string);
          return {
            ...request,
            thumbnail: trackInfo.thumbnail || 'https://via.placeholder.com/150'
          };
        }));
        setRequests(requestsWithThumbnails);

        // Automatically add to queue if autoplay is enabled
        if (autoplay && requestsWithThumbnails.length > 0) {
          for (const request of requestsWithThumbnails) {
            // Ensure the request hasn't already been processed
            if (!processedRequests.has(request.id)) {
              await addToQueue(request.song, request.artist, request.id);
              setProcessedRequests(prev => new Set(prev).add(request.id)); // Mark as processed
            }
          }
        }
      }
    };

    // Polling mechanism: Fetch requests every 2 seconds
    const interval = setInterval(fetchRequests, 2000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [show_id, autoplay, processedRequests]);

  useEffect(() => {
    const channel = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests', filter: `show_id=eq.${show_id}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const trackInfo = await fetchTrackId(payload.new.song, payload.new.artist, show_id as string);
            const newRequest = { ...payload.new, thumbnail: trackInfo.thumbnail || 'https://via.placeholder.com/50' } as Request;

            setRequests((prevRequests) => [
              ...prevRequests,
              newRequest
            ]);

            // Automatically add to queue if autoplay is enabled and hasn't been processed yet
            if (autoplay && !processedRequests.has(newRequest.id)) {
              await addToQueue(newRequest.song, newRequest.artist, newRequest.id);
              setProcessedRequests(prev => new Set(prev).add(newRequest.id)); // Mark as processed
            }
          }
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [show_id, autoplay, processedRequests]);

  const addToQueue = async (song: string, artist: string, requestId: string) => {
    try {
      const trackInfo = await fetchTrackId(song, artist, show_id as string);

      if (!trackInfo.id) {
        alert('Could not find track on Spotify');
        return;
      }

      const trackUri = `spotify:track:${trackInfo.id}`;

      // Add the track to the queue instead of the playlist
      const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${trackUri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.reason === 'NO_ACTIVE_DEVICE') {
          alert('No active Spotify device found. Please start playing a song on any device before adding to the queue.');
        } else {
          alert(`Error adding track to queue: ${errorData.error?.message || 'Unknown error'}`);
        }
        return;
      }

      console.log('Track added to queue:', trackInfo.id);

      // Remove the song request from Supabase
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting request:', error);
        alert('Error removing song request. Please try again.');
      } else {
        // Remove the song from the list
        setRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));
      }
    } catch (error) {
      console.error('Error adding track to queue:', error);
      alert('Error adding track to queue. Check the console for more details.');
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

  const clearAllRequests = async () => {
    try {
      // Clear all song requests without adding to Spotify
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('show_id', show_id);

      if (error) {
        console.error('Error clearing requests:', error);
        alert('Error clearing requests. Please try again.');
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error clearing requests:', error);
      alert('Error clearing requests. Check the console for more details.');
    }
  };

  return (
    <div style={pageStyle}>
      <Header />
      <main style={mainStyle}>
        {showName && <h1 style={headingStyle}>{showName}</h1>}
        <div style={toggleContainerStyle}>
          <span>Enable Autoplay</span>
          <label className="switch">
            <input type="checkbox" checked={autoplay} onChange={toggleAutoplay} />
            <span className="slider round"></span>
          </label>
        </div>
        <button style={buttonStyle} onClick={clearAllRequests}>Clear All</button>
        <div style={listContainerStyle}>
          <SongRequestTable requests={requests} token={token} autoplay={autoplay} addToQueue={addToQueue} deleteRequest={deleteRequest} />
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps = async (context: any) => {
  const { show_id, code } = context.query;

  const { data: showData, error: showError } = await supabase
    .from('shows')
    .select('id, code, name, autoplay')
    .eq('id', show_id)
    .eq('code', code)
    .single();

  if (showError || !showData) {
    return { notFound: true };
  }

  const { data: requestData, error: requestError } = await supabase
    .from('requests')
    .select('*')
    .eq('show_id', show_id)
    .order('created_at', { ascending: true });

  if (requestError) {
    console.error('Error fetching song requests:', requestError);
    return { notFound: true };
  }

  const requestsWithThumbnails = await Promise.all(requestData.map(async (request: any) => {
    const trackInfo = await fetchTrackId(request.song, request.artist, show_id as string);
    return {
      ...request,
      thumbnail: trackInfo.thumbnail || 'https://via.placeholder.com/50'
    };
  }));

  const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .select('access_token')
    .eq('show_id', show_id)
    .single();

  if (tokenError || !tokenData) {
    console.error('Error fetching token:', tokenError);
    return { notFound: true };
  }

  return {
    props: {
      initialRequests: requestsWithThumbnails,
      showName: showData.name,
      token: tokenData.access_token,
    },
  };
};

export default ShowPage;

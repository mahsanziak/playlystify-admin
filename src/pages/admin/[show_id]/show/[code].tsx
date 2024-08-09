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
  fontFamily: 'Montserrat, sans-serif',
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

const ShowPage: React.FC<{ initialRequests: Request[], showName: string, token: string }> = ({ initialRequests, showName, token }) => {
  const router = useRouter();
  const { show_id } = router.query;
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [autoplay, setAutoplay] = useState(false); // State for autoplay

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
      }
    };

    fetchRequests();

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

            // Automatically add to queue if autoplay is enabled
            if (autoplay) {
              await addToQueue(newRequest.song, newRequest.artist, newRequest.id);
            }
          }
          // ... other event handlers (UPDATE, DELETE)
        }
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [show_id, autoplay]);

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

  return (
    <div style={pageStyle}>
      <Header />
      <main style={mainStyle}>
        {showName && <h1 style={headingStyle}>{showName}</h1>}
        <div style={listContainerStyle}>
          <button onClick={() => setAutoplay(prev => !prev)}>
            {autoplay ? "Disable Autoplay" : "Enable Autoplay"}
          </button>
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
    .select('id, code, name')
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
      thumbnail: trackInfo.thumbnail || 'https://via.placeholder.com/150'
    };
  }));

  // Fetch the token
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

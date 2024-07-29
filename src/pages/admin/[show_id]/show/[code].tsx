// [code].tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../../components/Header';
import SongRequestTable from '../../../../components/SongRequestTable';
import SwipingInterface from '../../../../components/SwipingInterface';
import { supabase } from '../../../../../utils/supabaseClient';

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
};

const headingStyle: React.CSSProperties = {
  fontSize: '32px',
  marginBottom: '16px',
  fontWeight: '700',
  color: '#4caf50',
  fontFamily: 'Helvetica, Arial, sans-serif',
};

const ShowPage: React.FC = () => {
  const router = useRouter();
  const { show_id, code } = router.query;
  const [showName, setShowName] = useState<string | null>(null);
  const [validShow, setValidShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(process.env.NEXT_PUBLIC_SPOTIFY_TOKEN || null);
  const [isMobileView, setIsMobileView] = useState(false);

  const toggleView = () => {
    setIsMobileView((prevView) => !prevView);
  };

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

    validateShow();

    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      if (accessToken) {
        setToken(accessToken);
      }
    }
  }, [show_id, code, token]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '32px' }}>Loading...</div>;
  }

  if (!validShow) {
    return (
      <div style={pageStyle}>
        <Header isMobileView={isMobileView} toggleView={toggleView} />
        <main style={mainStyle}>
          <h2 style={{ ...headingStyle, color: '#ef4444' }}>Invalid Show ID or Code</h2>
          <p>Please check the URL and try again.</p>
        </main>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Header isMobileView={isMobileView} toggleView={toggleView} />
      <main style={mainStyle}>
        {showName && <h2 style={headingStyle}>{showName}</h2>}
        {show_id && code && token && (
          isMobileView ? (
            <SwipingInterface showId={show_id as string} code={code as string} token={token} />
          ) : (
            <SongRequestTable showId={show_id as string} code={code as string} token={token} />
          )
        )}
      </main>
    </div>
  );
};

export default ShowPage;

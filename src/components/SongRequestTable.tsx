import React from 'react';

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

const tableStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
};

const thumbnailStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  borderRadius: '8px',
  marginRight: '20px',
};

const songInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const songTitleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '16px',
  color: '#ffffff',
};

const artistNameStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#cccccc',
};

const buttonContainerStyle: React.CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#1DB954',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginLeft: '10px',
};

const deleteButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ef4444',
};

const SongRequestTable: React.FC<{ requests: Request[], token: string, autoplay: boolean, addToQueue: (song: string, artist: string, requestId: string) => void, deleteRequest: (requestId: string) => void }> = ({ requests, token, autoplay, addToQueue, deleteRequest }) => {
  if (requests.length === 0) {
    return <div>No song requests found for this show.</div>;
  }

  return (
    <div style={{ width: '100%', marginTop: '24px' }}>
      <div style={tableStyle}>
        {requests.map((request) => (
          <div key={request.id} style={rowStyle}>
            <img src={request.thumbnail || 'https://via.placeholder.com/50'} alt="thumbnail" style={thumbnailStyle} />
            <div style={songInfoStyle}>
              <div style={songTitleStyle}>{request.song}</div>
              <div style={artistNameStyle}>{request.artist}</div>
            </div>
            <div style={buttonContainerStyle}>
              <button style={deleteButtonStyle} onClick={() => deleteRequest(request.id)}>×</button>
              {!autoplay && (
                <button style={buttonStyle} onClick={() => addToQueue(request.song, request.artist, request.id)}>+</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongRequestTable;

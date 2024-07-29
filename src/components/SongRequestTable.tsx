import React, { useState } from 'react';
import fetchTrackId from '../../utils/fetchTrackId';

type Request = {
  id: string;
  show_id: string;
  artist: string;
  song: string; // This is the song title
  thumbnail: string | null; // Allow thumbnail to be nullable
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const thumbnailStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  marginRight: '10px',
  borderRadius: '5px',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '4px',
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const deleteButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#ef4444',
  marginRight: '10px',
};

const addButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#1DB954',
};

const toggleButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#10b981',
  marginBottom: '16px',
};

const SongRequestTable: React.FC<{ requests: Request[]; token: string; addToQueue: (song: string, artist: string, requestId: string) => void; deleteRequest: (requestId: string) => void }> = ({ requests, token, addToQueue, deleteRequest }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

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
            <th style={thStyle}>Song</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td style={tdStyle}>
                <img src={request.thumbnail || 'https://via.placeholder.com/50'} alt="thumbnail" style={thumbnailStyle} />
                <div>
                  <div>{request.song}</div>
                  <div>{request.artist}</div>
                </div>
                <div>
                  <button style={deleteButtonStyle} onClick={() => deleteRequest(request.id)}>×</button>
                  <button style={addButtonStyle} onClick={() => addToQueue(request.song, request.artist, request.id)}>+</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SongRequestTable;

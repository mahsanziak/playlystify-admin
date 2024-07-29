import React, { useState } from 'react';
import TinderCard from 'react-tinder-card';
import fetchTrackId from '../../utils/fetchTrackId';

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

const SwipingInterface: React.FC<{ requests: Request[]; token: string; addToQueue: (song: string, artist: string, requestId: string) => void; deleteRequest: (requestId: string) => void }> = ({ requests, token, addToQueue, deleteRequest }) => {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const onSwipe = (direction: string, request: Request) => {
    if (direction === 'right') {
      addToQueue(request.song, request.artist, request.id);
    } else if (direction === 'left') {
      deleteRequest(request.id);
    }
    setSwipeDirection(null);
  };

  const onCardLeftScreen = (direction: string) => {
    setSwipeDirection(null);
  };

  const onSwipeDirection = (direction: string) => {
    setSwipeDirection(direction);
  };

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
          onCardLeftScreen={onCardLeftScreen}
          onSwipeRequirementFulfilled={onSwipeDirection}
        >
          <div className="card">
            <div className="thumbnail-container">
              <img src={request.thumbnail || 'https://via.placeholder.com/150'} alt={`${request.artist} - ${request.song}`} />
            </div>
            <h3>{request.song}</h3>
            <p>{request.artist}</p>
            {swipeDirection === 'left' && (
              <div className="swipe-symbol swipe-symbol-left">×</div>
            )}
            {swipeDirection === 'right' && (
              <div className="swipe-symbol swipe-symbol-right">+</div>
            )}
          </div>
        </TinderCard>
      ))}
    </div>
  );
};

export default SwipingInterface;

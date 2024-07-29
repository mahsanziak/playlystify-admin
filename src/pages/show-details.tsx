import React, { useState } from 'react';
import Header from '../components/Header';

const ShowDetails: React.FC = () => {
  const [isMobileView, setIsMobileView] = useState(false);

  const toggleView = () => {
    setIsMobileView((prevView) => !prevView);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header isMobileView={isMobileView} toggleView={toggleView} />
      <main className="flex-1 p-4">
        <h2 className="text-2xl font-semibold mb-4">Show Details</h2>
        <p>Details about the show will be displayed here.</p>
      </main>
    </div>
  );
};

export default ShowDetails;

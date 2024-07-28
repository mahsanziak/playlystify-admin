import React from 'react';
import Header from '../components/Header';

const ShowDetails: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <main className="flex-1 p-4">
        <h2 className="text-2xl font-semibold mb-4">Show Details</h2>
        <p>Details about the show will be displayed here.</p>
      </main>
    </div>
  );
};

export default ShowDetails;

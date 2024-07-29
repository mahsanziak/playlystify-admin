import React from 'react';
import { useRouter } from 'next/router';

const Header: React.FC<{ isMobileView: boolean; toggleView: () => void }> = ({ isMobileView, toggleView }) => {
  const router = useRouter();

  return (
    <header className="bg-indigo-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-center items-center">
        <h1 className="text-2xl font-bold text-right flex-1">Admin Dashboard</h1>
        <nav className="flex space-x-4">
          <button
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            onClick={toggleView}
          >
            {isMobileView ? 'Normal View' : 'Mobile View'}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

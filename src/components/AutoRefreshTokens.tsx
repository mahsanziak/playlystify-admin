// src/components/AutoRefreshTokens.tsx
import { useEffect } from 'react';

const AutoRefreshTokens = () => {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/testRefreshToken');
        if (!response.ok) {
          console.error('Error refreshing tokens');
        } else {
          console.log('Tokens refreshed successfully');
        }
      } catch (error) {
        console.error('Error refreshing tokens:', error);
      }
    }, 60000); // Refresh every 6 seconds

    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  return null; // This component doesn't render anything
};

export default AutoRefreshTokens;

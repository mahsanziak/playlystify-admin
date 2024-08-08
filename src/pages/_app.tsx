import '../styles/globals.css';
import type { AppProps } from 'next/app';
import '@fortawesome/fontawesome-free/css/all.min.css';
import AutoRefreshTokens from '../components/AutoRefreshTokens';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <AutoRefreshTokens />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

// src/types/global.d.ts
export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

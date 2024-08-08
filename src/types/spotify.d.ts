// types/spotify.d.ts
declare namespace Spotify {
  interface Player {
    new (options: PlayerOptions): Player;
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(
      event: 'ready' | 'not_ready' | 'player_state_changed',
      callback: (state: PlayerState | ReadyEventData) => void
    ): void;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  interface PlayerState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: {
        id: string;
        uri: string;
        name: string;
        album: {
          uri: string;
          name: string;
          images: { url: string }[];
        };
        artists: { uri: string; name: string }[];
      };
      previous_tracks: {
        id: string;
      }[];
      next_tracks: {
        id: string;
      }[];
    };
  }

  interface ReadyEventData {
    device_id: string;
  }
}

declare var Spotify: {
  Player: {
    new (options: Spotify.PlayerOptions): Spotify.Player;
  };
};

import { useEffect, useState } from "react";
import { BackendProviderHooks, PlayerInfo, SongInfo } from "../type";

export const navidromeHooks: BackendProviderHooks = {
  usePlayerInfo: (songInfo) => {
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
    useEffect(() => {
      const audio = document.querySelector("audio");
      if (!audio) {
        console.warn("Audio element not found");
        return;
      }

      const timer = setInterval(() => {
        if (audio.paused) {
          return;
        }
        setPlayerInfo({
          paused: audio.paused,
          currentTime: audio.currentTime,
        });
      }, 100);

      return () => {
        clearInterval(timer);
      };
    }, [songInfo]);

    return playerInfo;
  },
  useSongInfo: () => {
    const [songInfo, setSongInfo] = useState<
      SongInfo | null
    >(null);
    useEffect(() => {
      const musicPlayerElement = document.querySelector(".music-player-panel");
      if (!musicPlayerElement) {
        return;
      }
      const handler = () => {
        const title = musicPlayerElement.querySelector(
          ".audio-title .songTitle",
        )?.textContent;
        const artist = musicPlayerElement.querySelector(
          ".audio-title .songArtist",
        )
          ?.textContent;
        const album =
          musicPlayerElement.querySelector(".audio-title .songAlbum")
            ?.textContent ?? undefined;

        if (!title || !artist) {
          return;
        }

        if (
          title === songInfo?.title && artist === songInfo?.artist[0] &&
          album === songInfo?.album
        ) {
          return;
        }

        setSongInfo({
          title,
          artist: [artist],
          album,
        });
      };
      const observer = new MutationObserver(handler);
      observer.observe(musicPlayerElement, {
        childList: true,
        subtree: true,
      });

      handler();

      return () => {
        observer.disconnect();
      };
    }, []);

    return songInfo;
  },
};

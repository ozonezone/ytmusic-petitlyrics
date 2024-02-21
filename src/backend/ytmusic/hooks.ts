import { useEffect, useState } from "react";
import { BackendProviderHooks, PlayerInfo, SongInfo } from "../type";

export const ytmusicHooks: BackendProviderHooks = {
  usePlayerInfo: (songInfo) => {
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
    useEffect(() => {
      const video = document.querySelector("video");
      if (!video) {
        return;
      }

      let startTime = video.currentTime;

      const timer = setInterval(() => {
        if (video.paused) {
          return;
        }
        setPlayerInfo({
          paused: video.paused,
          currentTime: video.currentTime - startTime,
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
      const songInfoElement = document.querySelector(
        ".ytmusic-player-bar .content-info-wrapper",
      );
      if (!songInfoElement) {
        return;
      }
      const handler = () => {
        const title = songInfoElement.querySelector(".title")?.textContent;
        if (!title) {
          return;
        }
        const info = songInfoElement.querySelectorAll(".byline a");
        let artist: string[] = [];
        let album = undefined;
        info.forEach((element, index) => {
          const href = element.getAttribute("href");
          if (!href) {
            return;
          }
          if (/.*channel\/.+/g.test(href)) {
            if (element.textContent) {
              artist.push(element.textContent);
            }
          } else if (/.*browse\/.+/g.test(href)) {
            if (element.textContent) {
              album = element.textContent;
            }
          }
        });
        setSongInfo({
          title,
          artist,
          album,
        });
      };
      const observer = new MutationObserver(handler);
      observer.observe(songInfoElement, {
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

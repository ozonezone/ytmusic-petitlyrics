import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export type SongInfo = {
  title: string;
  artist: string[];
  album?: string;
};

const songInfoAtom = atom<SongInfo | null>(null);

export const useSongInfo = () => {
  const songInfo = useAtomValue(songInfoAtom);
  return songInfo;
};

export const SongInfoProvider = () => {
  const setSongInfo = useSetAtom(songInfoAtom);

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

  return <></>;
};

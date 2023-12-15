import { onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

export type SongInfo = {
  data?: {
    title: string;
    artist: string[];
    album?: string;
  };
};

export const useSongInfo = () => {
  const [songInfo, setSongInfo] = createStore<SongInfo>({});

  let observer: MutationObserver;
  onMount(() => {
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
      setSongInfo("data", {
        title,
        artist,
        album,
      });
    };
    observer = new MutationObserver(handler);
    observer.observe(songInfoElement, {
      childList: true,
      subtree: true,
    });

    handler();
  });
  onCleanup(() => {
    observer?.disconnect();
  });

  return songInfo;
};

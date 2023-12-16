import { onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

export type PlayerInfo = {
  data?: {
    paused: boolean;
    currentTime: number;
  };
};

// We don't use video tag to get current position because sometimes audio source will not changed even if the song is changed
// and as a result, currentTime is incorrect.
export const usePlayerInfo = () => {
  const [playerInfo, setPlayerInfo] = createStore<PlayerInfo>({});

  let observer: MutationObserver;
  let slider: HTMLDivElement;
  let video: HTMLVideoElement;

  let timer: null | number = null;

  onMount(() => {
    const s = document.querySelector("#progress-bar #sliderBar");
    const v = document.querySelector("video");
    if (!s || !v) {
      return;
    }
    slider = s as HTMLDivElement;
    video = v as HTMLVideoElement;

    let prev = 0;
    const handler = () => {
      let value = Number(slider.getAttribute("value"));

      if (value % 2 != 0) {
        return;
      }

      const delta = performance.now() - prev;
      prev = performance.now();
      if (1500 <= delta && delta <= 2500) {
        if (playerInfo.data!.currentTime < value) {
          return;
        }
      }

      setPlayerInfo("data", {
        paused: video.paused,
        currentTime: value,
      });

      if (timer) {
        clearInterval(timer);
      }

      let time = performance.now();
      timer = setInterval(() => {
        if (video.paused) {
          return;
        }
        setPlayerInfo("data", {
          paused: video.paused,
          currentTime: (performance.now() - time) / 1000 + value,
        });
      }, 100);
    };

    observer = new MutationObserver(handler);
    observer.observe(slider, {
      childList: false,
      attributes: true,
      attributeFilter: ["value"],
      subtree: false,
    });
    handler();
  });

  onCleanup(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return playerInfo;
};

import { onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

export type PlayerInfo = {
  data?: {
    paused: boolean;
    currentTime: number;
  };
};

export const usePlayerInfo = () => {
  const [playerInfo, setPlayerInfo] = createStore<PlayerInfo>({});

  const listener = (event: Event) => {
    const elem = event.target as HTMLVideoElement;
    setPlayerInfo("data", {
      paused: elem.paused,
      currentTime: elem.currentTime,
    });
  };
  onMount(() => {
    const videoElement = document.querySelector("video");
    if (!videoElement) {
      return;
    }
    videoElement.addEventListener("timeupdate", listener);
  });

  onCleanup(() => {
    const videoElement = document.querySelector("video");
    if (!videoElement) {
      return;
    }
    videoElement.removeEventListener("timeupdate", listener);
  });

  return playerInfo;
};

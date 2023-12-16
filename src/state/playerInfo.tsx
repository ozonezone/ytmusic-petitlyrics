import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useSongInfo } from "./songInfo";

export type PlayerInfo = {
  paused: boolean;
  currentTime: number;
};

const playerInfoAtom = atom<PlayerInfo | null>(null);

export const usePlayerInfo = () => {
  return useAtomValue(playerInfoAtom);
};

export const PlayerInfoProvider = () => {
  const setPlayerInfo = useSetAtom(playerInfoAtom);
  const songInfo = useSongInfo();

  useEffect(() => {
    const video = document.querySelector("video");
    if (!video) {
      return;
    }

    let startTime = video.currentTime;
    console.log("startTime", startTime);

    const listener = () => {
      setPlayerInfo({
        paused: video.paused,
        currentTime: video.currentTime - startTime,
      });
    };
    video.addEventListener("timeupdate", listener);

    return () => {
      video.removeEventListener("timeupdate", listener);
    };
  }, [songInfo]);

  return <></>;
};

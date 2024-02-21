import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { useSongInfo } from "./songInfo";
import { PlayerInfo } from "../backend/type";
import { backend } from "../backend";

const playerInfoAtom = atom<PlayerInfo | null>(null);

export const usePlayerInfo = () => {
  return useAtomValue(playerInfoAtom);
};

export const PlayerInfoProvider = () => {
  const setPlayerInfo = useSetAtom(playerInfoAtom);
  const songInfo = useSongInfo();

  const playerInfo = backend.hooks.usePlayerInfo(songInfo);

  useEffect(() => {
    setPlayerInfo(playerInfo);
  }, [playerInfo]);

  return <></>;
};

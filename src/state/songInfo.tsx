import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { SongInfo } from "../backend/type";
import { backend } from "../backend";

const songInfoAtom = atom<SongInfo | null>(null);

export const useSongInfo = () => {
  const songInfo = useAtomValue(songInfoAtom);
  return songInfo;
};

export const SongInfoProvider = () => {
  const setSongInfo = useSetAtom(songInfoAtom);

  const songInfo = backend.hooks.useSongInfo();

  useEffect(() => {
    setSongInfo(songInfo);
  }, [songInfo]);

  return <></>;
};

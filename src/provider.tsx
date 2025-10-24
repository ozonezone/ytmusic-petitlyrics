import { SWRConfig } from "swr";
import { PlayerInfoProvider } from "./state/playerInfo";
import { SongInfoProvider } from "./state/songInfo";
import { Provider as JotaiProvider } from "jotai";
import { ReactNode } from "react";

export function Provider(props: { children: ReactNode }) {
  return (
    <SWRConfig>
      <JotaiProvider>
        {props.children}
        <PlayerInfoProvider />
        <SongInfoProvider />
      </JotaiProvider>
    </SWRConfig>
  );
}

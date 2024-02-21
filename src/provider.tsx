import { SWRConfig } from "swr";
import { PlayerInfoProvider } from "./state/playerInfo";
import { SongInfoProvider } from "./state/songInfo";
import { Provider as JotaiProvider } from "jotai";

export function Provider(props: { children: JSX.Element }) {
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

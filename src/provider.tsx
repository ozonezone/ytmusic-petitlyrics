import { SWRConfig } from "swr";
import { PlayerInfoProvider } from "./state/playerInfo";
import { SongInfoProvider } from "./state/songInfo";

export function Provider(props: { children: JSX.Element }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then((r) => r.json()),
      }}
    >
      {props.children}
      <PlayerInfoProvider />
      <SongInfoProvider />
    </SWRConfig>
  );
}

import { SWRConfig } from "swr";
import { PlayerInfoProvider } from "./state/playerInfo";
import { SongInfoProvider } from "./state/songInfo";

export function Provider(props: { children: JSX.Element }) {
  return (
    <SWRConfig>
      {props.children}
      <PlayerInfoProvider />
      <SongInfoProvider />
    </SWRConfig>
  );
}

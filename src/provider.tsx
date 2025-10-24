import { PlayerInfoProvider } from "./state/playerInfo";
import { SongInfoProvider } from "./state/songInfo";
import { Provider as JotaiProvider } from "jotai";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Provider(props: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        {props.children}
        <PlayerInfoProvider />
        <SongInfoProvider />
      </JotaiProvider>
    </QueryClientProvider>
  );
}

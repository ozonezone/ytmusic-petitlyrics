import { createResource, createSignal, Match, Switch } from "solid-js";
import { Portal } from "solid-js/web";
import { useSongInfo } from "./hooks/useSongInfo";
import { getNotSyncedLyrics, getWordSyncedLyrics } from "./petitlyrics/get";
import { search } from "./petitlyrics/search";
import { ValiError } from "valibot";
import { WordSyncLyrics } from "./WordSyncLyrics";
import { LyricIcon } from "./components/LyricIcon";

export type WordSyncLyricsData = Awaited<
  ReturnType<typeof getWordSyncedLyrics>
>;
type LyricsResult = {
  type: 1;
  data: string;
} | {
  type: 3;
  data: WordSyncLyricsData;
} | {
  type: "error";
  message: string;
};

const App = (props: { controlParent: Element }) => {
  const [show, setShow] = createSignal(true);

  const songInfo = useSongInfo();

  const [data] = createResource(() => {
    return {
      artist: songInfo.data?.artist,
      album: songInfo.data?.album,
      title: songInfo.data?.title,
    };
  }, async (data) => {
    let searchData: Awaited<ReturnType<typeof search>>;
    try {
      searchData = await search({
        key_artist: data.artist?.[0],
        key_title: data.title,
        key_album: data.album,
        maxCount: 10,
      });
    } catch (e) {
      console.log("Failed to search song", e);
      if (e instanceof ValiError) {
        console.log("issues:", e.issues);
      } else {
        try {
          console.log("Falling back to no album");
          searchData = await search({
            key_artist: data.artist?.[0],
            key_title: data.title,
            maxCount: 10,
          });
        } catch (e) {
          console.log("Failed to search song (fallback)", e);
          if (e instanceof ValiError) {
            console.log("issues:", e.issues);
          }
        }
      }
      return { type: "error", message: "Failed to search song" };
    }

    const lyricsId = searchData.response.songs.song?.[0]?.lyricsId;
    if (!lyricsId) {
      return { type: "error", message: "No lyrics found" };
    }

    let lyricsData: LyricsResult;
    try {
      lyricsData = {
        type: 3,
        data: await getWordSyncedLyrics({ key_lyricsId: lyricsId }),
      };
    } catch (e) {
      if (e instanceof ValiError) {
        console.warn(
          "Failed to search song: ValiError. Falling back to non-sync lyrics. issues:",
          e.issues,
        );
      } else {
        console.warn(
          "Failed to search song. Falling back to non-sync lyrics.",
          e,
        );
      }
      try {
        lyricsData = {
          type: 1,
          data: await getNotSyncedLyrics({ key_lyricsId: lyricsId }),
        };
      } catch (e) {
        return { type: "error", message: "Failed to get lyrics (fallback)" };
      }
    }

    console.log("lyricsData", lyricsData);

    return lyricsData;
  });

  return (
    <div>
      <Portal mount={props.controlParent}>
        <button
          style={{
            height: "36px",
            width: "36px",
            background: "none",
            border: "none",
            color: "white",
            "margin-left": "2px",
          }}
          onClick={() => {
            setShow(!show());
          }}
        >
          <LyricIcon />
        </button>
      </Portal>
      <div
        style={{
          display: show() ? "block" : "none",
          position: "fixed",
          height:
            "calc(100vh - var(--ytmusic-nav-bar-height) - var(--ytmusic-player-bar-height))",
          width: "400px",
          "background-color": "black",
          top: "var(--ytmusic-nav-bar-height)",
          right: 0,
          "z-index": 3,
          color: "white",
          "font-size": "medium",
        }}
      >
        <div>
          {songInfo.data?.title} - {songInfo.data?.artist[0]}
        </div>
        <Switch fallback={<div>No lyrics</div>}>
          <Match when={data.loading}>Loading...</Match>
          <Match when={data()}>
            {(data) => (
              <Switch fallback={<div>unknown error</div>}>
                <Match when={data().type == 1}>
                  <div style={{ "white-space": "pre-wrap" }}>
                    {(data() as any).data as string}
                  </div>
                </Match>
                <Match when={data().type == 3}>
                  <WordSyncLyrics
                    data={(data() as any).data as WordSyncLyricsData}
                  />
                </Match>
                <Match when={data().type == "error"}>
                  Error: {(data() as any).message as string}
                </Match>
              </Switch>
            )}
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default App;

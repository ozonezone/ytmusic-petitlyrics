import { createResource, createSignal, Match, Show, Switch } from "solid-js";
import { Portal } from "solid-js/web";
import { useSongInfo } from "./hooks/useSongInfo";
import { WordSyncLyrics } from "./WordSyncLyrics";
import { LyricIcon } from "./components/LyricIcon";
import { decode } from "html-entities";
import { getLyrics } from "./lyrics";

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
    if (!data.artist && !data.title && !data.album) {
      return null;
    }

    return await getLyrics(data);
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
          display: show() ? "flex" : "none",
          "flex-direction": "column",
          position: "fixed",
          height:
            "calc(100vh - var(--ytmusic-nav-bar-height) - var(--ytmusic-player-bar-height))",
          width: "400px",
          "background-color": "rgba(0, 0, 0, 0.8)",
          top: "var(--ytmusic-nav-bar-height)",
          right: 0,
          "z-index": 3,
          color: "white",
          "font-size": "medium",
          padding: "0 10px",
          "box-sizing": "border-box",
        }}
      >
        <Switch fallback={<div>No song</div>}>
          <Match when={data.loading}>Loading...</Match>
          <Match when={data()}>
            {(data) => (
              <Show
                when={data().success}
                fallback={
                  <div>
                    Error: {data().message.join(", ")}
                  </div>
                }
              >
                <div
                  style={{
                    "border-bottom": "1px solid white",
                    "font-size": "large",
                  }}
                >
                  {decode((data() as any).data.metaData.title)}
                  {" - "}
                  {decode((data() as any).data.metaData.artist)}{" "}
                  <a
                    href={"https://petitlyrics.com/lyrics/" +
                      (data() as any).data.metaData.lyricsId}
                  >
                    Link
                  </a>
                </div>
                <div
                  style={{ "flex-grow": 1, "height": "100%", "min-height": 0 }}
                >
                  <Switch fallback={<div>never occur</div>}>
                    <Match when={(data() as any).data}>
                      <WordSyncLyrics data={(data() as any).data} />
                    </Match>
                    <Match when={(data() as any).data}>
                      <div style={{ "overflow-y": "scroll", height: "100%" }}>
                        <pre>{(data() as any).data.data}</pre>
                      </div>
                    </Match>
                  </Switch>
                </div>
              </Show>
            )}
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default App;

import { createResource, createSignal, Match, Show, Switch } from "solid-js";
import { Portal } from "solid-js/web";
import { useSongInfo } from "./hooks/useSongInfo";
import { LyricIcon } from "./components/atom/LyricIcon";
import { getLyrics, LyricsData } from "./lyrics";
import { LyricsViewer } from "./components/lyricsViewer";
import IconSettings from "./components/atom/SettingsIcon";
import { GlobalSettings } from "./components/GlobalSettings";

const App = (props: { controlParent: Element }) => {
  const [show, setShow] = createSignal(true);
  const [showSettings, setShowSettings] = createSignal(true);

  const songInfo = useSongInfo();

  const [lyricsResult] = createResource(() => {
    return {
      artist: songInfo.data?.artist,
      album: songInfo.data?.album,
      title: songInfo.data?.title,
    };
  }, async (lyricsResult) => {
    if (!lyricsResult.artist && !lyricsResult.title && !lyricsResult.album) {
      return null;
    }

    return await getLyrics(lyricsResult);
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
          <LyricIcon height="20px" width="20px" />
        </button>
      </Portal>
      <Show when={show()}>
        <div
          style={{
            display: "flex",
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
          <div style={{ display: "flex", "flex-direction": "column" }}>
            <div
              style={{
                display: "flex",
                "align-items": "center",
              }}
            >
              <p style={{ color: "gray" }}>YTMusic petitlyrics</p>
              <button
                style={{
                  "background": "none",
                  "border": "none",
                  color: "white",
                  width: "25px",
                  height: "25px",
                }}
                onClick={() => {
                  setShowSettings(!showSettings());
                }}
              >
                <IconSettings width="15px" height="15px" />
              </button>
            </div>
            <Show when={showSettings()}>
              <div
                style={{
                  "border-bottom": "1px solid white",
                  "margin-bottom": "5px",
                }}
              >
                <GlobalSettings />
              </div>
            </Show>
          </div>
          <Switch fallback={<div>No song</div>}>
            <Match when={lyricsResult.loading}>Loading...</Match>
            <Match when={lyricsResult()}>
              {(data) => (
                <Show
                  when={data().success}
                  fallback={
                    <div>
                      Error: {data().message.join(", ")}
                    </div>
                  }
                >
                  <LyricsViewer
                    data={data() as LyricsData}
                  />
                </Show>
              )}
            </Match>
          </Switch>
        </div>
      </Show>
    </div>
  );
};

export default App;

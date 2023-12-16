import { createEffect, createMemo, createSignal, For } from "solid-js";
import { usePlayerInfo } from "../../hooks/usePlayerInfo";
import { decode } from "html-entities";
import { WordSyncLyricsData } from "../../lyrics";
import { globalSettings, songConfig } from "../../store";

export const WordSyncLyrics = (
  props: { lyrics: WordSyncLyricsData },
) => {
  const playerInfo = usePlayerInfo();

  const offset = createMemo(() => {
    return (songConfig.data?.offset ?? 0) + globalSettings.behavior.offset;
  });

  const pos = createMemo(() => {
    const crr = playerInfo.data?.currentTime ?? 0;
    let line_idx = 0;
    for (let line of props.lyrics.data.wsy.line) {
      let word_idx = 0;
      for (let word of line.word) {
        if (word.starttime > (crr + offset()) * 1000) {
          return [line_idx, word_idx] as const;
        }
        word_idx++;
      }
      line_idx++;
    }

    return [
      props.lyrics.data.wsy.line.length - 1,
      props.lyrics.data.wsy.line[props.lyrics.data.wsy.line.length - 1].word
        .length - 1,
    ] as const;
  });
  const linePos = createMemo(() => pos()[0]);
  const wordPos = createMemo(() => pos()[1]);

  createEffect(() => {
    const elm = document.getElementById("wsy-line-" + linePos());

    if (elm) {
      elm.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  });

  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          "overflow-y": "scroll",
          "height": "100%",
          "text-align": globalSettings.appearance.align,
        }}
      >
        <div style={{ "height": "50%" }} />
        <For each={props.lyrics.data.wsy.line}>
          {(line, i) => (
            <div
              id={"wsy-line-" + i()}
              style={{
                "background-color": i() === linePos()
                  ? "rgba(128, 128, 128, 0.1)"
                  : "transparent",
                "font-size": i() === linePos() ? "large" : "medium",
                "padding": i() === linePos() ? "5px 0" : "0",
              }}
            >
              <For each={line.word}>
                {(word) => (
                  <span
                    style={{
                      color: word.starttime <=
                          ((playerInfo.data?.currentTime ?? 0) + offset()) *
                            1000
                        ? "white"
                        : "gray",
                    }}
                  >
                    {decode(word.wordstring) +
                      " ".repeat(
                        word.chanum - word.wordstring.length < 0
                          ? 0
                          : word.chanum - word.wordstring.length,
                      )}
                  </span>
                )}
              </For>
              <br />
            </div>
          )}
        </For>
        <div style={{ "height": "50%" }} />
      </div>
    </div>
  );
};

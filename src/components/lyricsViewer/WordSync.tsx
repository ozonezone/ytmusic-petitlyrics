import { createMemo, createSignal, For } from "solid-js";
import { usePlayerInfo } from "../../hooks/usePlayerInfo";
import { decode } from "html-entities";
import { WordSyncLyricsData } from "../../lyrics";
import { globalSettings, songConfig } from "../../store";

export const WordSyncLyrics = (
  props: { lyrics: WordSyncLyricsData },
) => {
  const playerInfo = usePlayerInfo();

  const offset = createMemo(() => {
    return songConfig.data?.offset ?? 0 + globalSettings.behavior.offset;
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
            <div>
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

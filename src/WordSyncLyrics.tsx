import { createEffect, createSignal, For } from "solid-js";
import { usePlayerInfo } from "./hooks/usePlayerInfo";
import { decode } from "html-entities";
import { WordSyncLyricsData } from "./lyrics";

export const WordSyncLyrics = (props: { data: WordSyncLyricsData }) => {
  const playerInfo = usePlayerInfo();
  const [offset, setOffset] = createSignal(0);

  return (
    <div style={{ height: "100%" }}>
      <input
        type="number"
        value={offset()}
        onInput={(e) => {
          if (isNaN(e.currentTarget.valueAsNumber)) {
            return;
          }
          setOffset(e.currentTarget.valueAsNumber);
        }}
      />
      <div style={{ "overflow-y": "scroll", "height": "100%" }}>
        <div style={{ "height": "50%" }} />
        <For each={props.data.data.wsy.line}>
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

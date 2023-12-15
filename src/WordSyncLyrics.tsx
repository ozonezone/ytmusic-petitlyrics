import { createSignal, For } from "solid-js";
import { WordSyncLyricsData } from "./App";
import { usePlayerInfo } from "./hooks/usePlayerInfo";
import { decode } from "html-entities";

export const WordSyncLyrics = (props: { data: WordSyncLyricsData }) => {
  const playerInfo = usePlayerInfo();
  const [offset, setOffset] = createSignal(0);

  return (
    <div style={{ "overflow-y": "scroll", height: "100%" }}>
      <input
        type="number"
        value={offset()}
        onInput={(e) => {
          console.log(e.currentTarget.valueAsNumber);
          setOffset(e.currentTarget.valueAsNumber);
        }}
      />
      <For each={props.data.wsy.line}>
        {(line) => (
          <div>
            <For each={line.word}>
              {(word) => (
                <span
                  style={{
                    color: word.starttime <=
                        (playerInfo.data?.currentTime ?? 0 + offset()) * 1000
                      ? "white"
                      : "gray",
                    "font-weight": word.starttime <=
                        (playerInfo.data?.currentTime ?? 0 + offset()) * 1000
                      ? "bold"
                      : "normal",
                  }}
                >
                  {word.wordstring == "" ? " " : decode(word.wordstring)}
                </span>
              )}
            </For>
            <br />
          </div>
        )}
      </For>
    </div>
  );
};

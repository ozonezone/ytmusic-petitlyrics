import { decode } from "html-entities";
import { clsx } from "clsx";

import { WordSyncLyricsData } from "../../lib/lyrics";
import { usePlayerInfo } from "../../state/playerInfo";
import { useAtomValue } from "jotai";
import { globalConfigAtom } from "../../state/globalConfig";
import { useEffect } from "react";
import { useSongConfig } from "../../state/songConfig";

export const WordSyncLyrics = (
  props: { lyrics: WordSyncLyricsData },
) => {
  const playerInfo = usePlayerInfo();
  const [songConfig] = useSongConfig()!;
  const globalConfig = useAtomValue(globalConfigAtom);

  const offset = songConfig.offset + globalConfig.behavior.offset;

  const pos = (() => {
    const crr = playerInfo?.currentTime ?? 0;
    let line_idx = 0;
    for (let line of props.lyrics.data.wsy.line) {
      let word_idx = 0;
      for (let word of line.word) {
        if (word.endtime > (crr + offset) * 1000) {
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
  })();
  const linePos = pos[0];

  useEffect(() => {
    const elm = document.getElementById("wsy-line-" + linePos);

    if (elm) {
      elm.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [linePos]);

  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          textAlign: globalConfig.appearance.align,
        }}
        className="yp-overflow-y-scroll yp-h-full"
      >
        <div style={{ "height": "50%" }} />
        {props.lyrics.data.wsy.line.map((line, i) => (
          <div
            id={"wsy-line-" + i}
            key={i}
            className={clsx(
              i === linePos
                ? "yp-font-bold yp-txt-lg yp-py-2 yp-bg-gray-400/20"
                : "",
            )}
          >
            {line.word.map((word, j) => (
              <span
                key={j}
                style={{
                  color: word.starttime <=
                      ((playerInfo?.currentTime ?? 0) + offset) *
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
            ))}

            <br />
          </div>
        ))}
        <div style={{ "height": "50%" }} />
      </div>
    </div>
  );
};

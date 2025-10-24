import { decode } from "html-entities";
import { clsx } from "clsx";

import { WordSyncLyricsData } from "../../lib/lyrics";
import { usePlayerInfo } from "../../state/playerInfo";
import { useAtomValue } from "jotai";
import { globalConfigAtom } from "../../state/globalConfig";
import { useEffect, useMemo } from "react";
import { useSongConfig } from "../../state/songConfig";

export const WordSyncLyrics = (
  props: { lyrics: WordSyncLyricsData; syncMode: "word" | "line" },
) => {
  const playerInfo = usePlayerInfo();
  const [songConfig] = useSongConfig()!;
  const globalConfig = useAtomValue(globalConfigAtom);

  const offset = songConfig.offset + globalConfig.behavior.offset;

  const posInfo = props.lyrics.data.wsy.line.map((line, i) => {
    return line.word.map((word, j) => {
      return {
        line: i,
        word: j,
        start: word.starttime,
        end: word.endtime,
      };
    });
  }).flat();

  const pos: {
    line: number;
    word: number;
    start: number;
    end: number;
  } | null = (() => {
    const crr = ((playerInfo?.currentTime ?? 0) + offset) * 1000;
    const idx = posInfo.findIndex((p) => p.start > crr);
    return posInfo[idx - 1];
  })();
  const linePos = useMemo(() => pos?.line, [pos]);
  const wordPos = useMemo(() => pos?.word, [pos]);

  useEffect(() => {
    if (linePos) {
      const elm = document.getElementById("wsy-line-" + pos.line);

      if (elm) {
        elm.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [linePos]);

  return (
    <div className="yp:h-full">
      <div
        style={{
          textAlign: globalConfig.appearance.align,
          fontSize: globalConfig.appearance.fontSize,
        }}
        className="yp:overflow-y-scroll yp:h-full yp:[scrollbar-width:none]"
      >
        <div style={{ "height": "50%" }} />
        {props.lyrics.data.wsy.line.map((line, i) => {
          let lineColor;
          if (i < linePos) {
            lineColor = "yp:text-gray-400";
          } else if (linePos === undefined || i > linePos) {
            lineColor = "yp:text-gray-600";
          } else {
            if (props.syncMode == "word") {
              lineColor = "yp:text-gray-400";
            } else {
              lineColor = "yp:text-white";
            }
          }
          const delta = Math.abs(i - linePos);

          let fontSizeScale = 1;
          if (delta == 0) {
            fontSizeScale = 1.4;
          } else if (delta == 1) {
            fontSizeScale = 1.3;
          }

          return (
            <div
              id={"wsy-line-" + i}
              key={i}
              className={clsx(
                lineColor,
                "yp:py-2",
                {
                  "yp:py-6": delta == 0,
                  "yp:py-5": delta == 1,
                  "yp:py-4": delta == 2,
                },
              )}
              style={{
                fontSize: globalConfig.appearance.fontSize * fontSizeScale,
              }}
            >
              {line.word.map((word, j) => {
                const space = word.chanum - word.wordstring.length < 0
                  ? 0
                  : word.chanum - word.wordstring.length;
                const wordstring = decode(word.wordstring) + " ".repeat(space);

                return (
                  (
                    <span
                      key={j}
                      className={clsx({
                        "yp:text-white": props.syncMode == "word" &&
                          i == linePos &&
                          j <= wordPos,
                      })}
                    >
                      {wordstring}
                    </span>
                  )
                );
              })}

              <br />
            </div>
          );
        })}
        <div style={{ "height": "50%" }} />
      </div>
    </div>
  );
};

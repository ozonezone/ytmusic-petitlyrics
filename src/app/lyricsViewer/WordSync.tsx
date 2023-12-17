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
    <div style={{ height: "100%" }}>
      <div
        style={{
          textAlign: globalConfig.appearance.align,
          fontSize: globalConfig.appearance.fontSize,
        }}
        className="yp-overflow-y-scroll yp-h-full"
      >
        <div style={{ "height": "50%" }} />
        {props.lyrics.data.wsy.line.map((line, i) => (
          <div
            id={"wsy-line-" + i}
            key={i}
            className={clsx(
              {
                "yp-text-lg yp-py-2 yp-bg-gray-200/10": i == linePos,
              },
              (props.syncMode == "line" && i >= linePos)
                ? i == linePos ? "yp-text-white" : "yp-text-gray-700"
                : "yp-text-gray-400",
            )}
            style={{
              fontSize: i == linePos
                ? globalConfig.appearance.fontSize * 1.1
                : globalConfig.appearance.fontSize,
            }}
          >
            {line.word.map((word, j) => {
              const space = word.chanum - word.wordstring.length < 0
                ? 0
                : word.chanum - word.wordstring.length;
              const wordstring = decode(word.wordstring) + " ".repeat(space);

              const active = props.syncMode == "word" &&
                (i == linePos ? j <= wordPos : i < linePos);

              return (
                (
                  <span
                    key={j}
                    className={clsx({
                      "yp-text-white": active,
                    })}
                  >
                    {wordstring}
                  </span>
                )
              );
            })}

            <br />
          </div>
        ))}
        <div style={{ "height": "50%" }} />
      </div>
    </div>
  );
};

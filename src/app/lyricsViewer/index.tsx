import { decode } from "html-entities";
import IconLaunch from "~icons/ic/baseline-launch";

import { LyricsData } from "../../lib/lyrics";

import { WordSyncLyrics } from "./WordSync";
import { NonSyncLyrics } from "./NonSync";

export const LyricsViewer = (
  props: { data: LyricsData },
) => {
  return (
    <>
      <div className="yp-flex yp-font-md yp-border-b-white yp-border-1 yp-items-center">
        <div>
          {decode(props.data.lyrics.metaData.title)}
          {" - "}
          {decode(props.data.lyrics.metaData.artist)}
          {" "}
        </div>
        <a
          href={"https://petitlyrics.com/lyrics/" +
            props.data.lyrics.metaData.lyricsId}
          target="_blank"
          rel="noreferrer noopener"
          style={{ height: "20px", width: "20px" }}
        >
          <IconLaunch width="18px" height="18px" color="#00aaff" />
        </a>
      </div>
      <div className="yp-flex-grow yp-h-full yp-min-h-0">
        {props.data.lyricsType == 3
          ? (
            <WordSyncLyrics
              lyrics={props.data.lyrics}
            />
          )
          : (
            <NonSyncLyrics
              lyrics={props.data.lyrics}
            />
          )}
      </div>
    </>
  );
};

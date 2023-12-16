import { Match, Switch } from "solid-js";
import { decode } from "html-entities";

import { WordSyncLyrics } from "./WordSync";
import {
  LyricsData,
  NonSyncLyricsData,
  WordSyncLyricsData,
} from "../../lyrics";
import { NonSyncLyrics } from "./NonSync";
import { ExternalLinkIcon } from "../atom/LinkIcon";

export const LyricsViewer = (
  props: { data: LyricsData },
) => {
  return (
    <>
      <div
        style={{
          "border-bottom": "1px solid white",
          "font-size": "large",
          "display": "flex",
          "align-items": "center",
        }}
      >
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
          <ExternalLinkIcon width="18px" height="18px" color="#00aaff" />
        </a>
      </div>
      <div
        style={{ "flex-grow": 1, "height": "100%", "min-height": 0 }}
      >
        <Switch fallback={<div>never occur</div>}>
          <Match when={props.data.lyricsType == 3}>
            <WordSyncLyrics
              lyrics={props.data.lyrics as WordSyncLyricsData}
            />
          </Match>
          <Match when={props.data.lyricsType == 1}>
            <NonSyncLyrics
              lyrics={props.data.lyrics as NonSyncLyricsData}
            />
          </Match>
        </Switch>
      </div>
    </>
  );
};

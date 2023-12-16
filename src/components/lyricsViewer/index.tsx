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
        {decode(props.data.lyrics.metaData.title)}
        {" - "}
        {decode(props.data.lyrics.metaData.artist)}{" "}
        <a
          href={"https://petitlyrics.com/lyrics/" +
            props.data.lyrics.metaData.lyricsId}
          target="_blank"
          rel="noreferrer noopener"
        >
          <ExternalLinkIcon width="18px" height="18px" />
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

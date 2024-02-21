import { decode } from "html-entities";
import IconLaunch from "~icons/ic/baseline-launch";

import { LyricsData, WordSyncLyricsData } from "../../lib/lyrics";

import { WordSyncLyrics } from "./WordSync";
import { NonSyncLyrics } from "./NonSync";
import { useAtomValue } from "jotai";
import { globalConfigAtom } from "../../state/globalConfig";

const SyncSwitcher = (props: {
  lyrics: WordSyncLyricsData;
}) => {
  const globalConfig = useAtomValue(globalConfigAtom);

  if (globalConfig.behavior.syncMode == "none") {
    const lyricsText = props.lyrics.data.wsy.line.map((line) => line.linestring)
      .join("\n");
    return <NonSyncLyrics lyrics={lyricsText} />;
  } else {
    return (
      <WordSyncLyrics
        lyrics={props.lyrics}
        syncMode={globalConfig.behavior.syncMode}
      />
    );
  }
};

export const LyricsViewer = (
  props: { data: LyricsData },
) => {
  return (
    <>
      <div className="yp-flex yp-font-md yp-pb-2 yp-border-solid yp-border-t-transparent yp-border-x-transparent yp-border-b-white yp-border-b yp-items-center yp-font-bold yp-gap-2">
        <div className="yp-flex yp-flex-col yp-items-center yp-flex-grow">
          <span>
            {decode(props.data.lyrics.metaData.title)}
          </span>
          <span className="yp-text-gray-400 yp-text-sm">
            {decode(props.data.lyrics.metaData.artist)}
          </span>
        </div>
        <a
          href={"https://petitlyrics.com/lyrics/" +
            props.data.lyrics.metaData.lyricsId}
          target="_blank"
          rel="noreferrer noopener"
          className="yp-h-[20px] yp-w-[20px] yp-mr-2"
        >
          <IconLaunch width="18px" height="18px" color="#00aaff" />
        </a>
      </div>
      <div className="yp-flex-grow yp-h-full yp-min-h-0">
        {props.data.lyricsType == 3
          ? <SyncSwitcher lyrics={props.data.lyrics} />
          : (
            <NonSyncLyrics
              lyrics={props.data.lyrics.data}
            />
          )}
      </div>
    </>
  );
};

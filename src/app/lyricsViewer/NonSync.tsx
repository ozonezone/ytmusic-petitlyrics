import { NonSyncLyricsData } from "../../lib/lyrics";

export const NonSyncLyrics = (
  props: { lyrics: NonSyncLyricsData },
) => {
  return (
    <div className="yp-overflow-y-scroll yp-h-full">
      <pre>{props.lyrics.data}</pre>
    </div>
  );
};

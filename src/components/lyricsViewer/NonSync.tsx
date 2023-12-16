import { NonSyncLyricsData } from "../../lyrics";

export const NonSyncLyrics = (
  props: { lyrics: NonSyncLyricsData },
) => {
  return (
    <div style={{ "overflow-y": "scroll", height: "100%" }}>
      <pre>{props.lyrics.data}</pre>
    </div>
  );
};

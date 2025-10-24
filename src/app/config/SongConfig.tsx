import { useSongConfig } from "../../state/songConfig";
import { NumberForm, NumberFormWithButton } from "./forms";

export const SongConfig = () => {
  const [songConfig, key, setSongConfig] = useSongConfig()!;

  return (
    <div className="yp:grid yp:grid-cols-5">
      <NumberForm
        value={songConfig.offset}
        label="Offset"
        key={"1" + key}
        setter={(v) => {
          setSongConfig({ ...songConfig, offset: v });
        }}
      />
      <NumberFormWithButton
        value={songConfig.lyricsIdOverride}
        label="Lyrics ID"
        key={"2" + key}
        setter={(v) => {
          setSongConfig({ ...songConfig, lyricsIdOverride: v });
        }}
      />
    </div>
  );
};

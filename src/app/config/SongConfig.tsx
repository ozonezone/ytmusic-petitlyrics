import { useSongConfig } from "../../state/songConfig";
import { NumberForm, NumberFormWithButton } from "./forms";

export const SongConfig = () => {
  const [songConfig, setSongConfig] = useSongConfig()!;

  return (
    <div className="yp-flex yp-flex-col yp-gap-2">
      <NumberForm
        value={songConfig.offset}
        label="Offset"
        setter={(v) => {
          setSongConfig({ ...songConfig, offset: v });
        }}
      />
      <NumberFormWithButton
        value={songConfig.lyricsIdOverride}
        label="Lyrics ID"
        setter={(v) => {
          setSongConfig({ ...songConfig, lyricsIdOverride: v });
        }}
      />
    </div>
  );
};

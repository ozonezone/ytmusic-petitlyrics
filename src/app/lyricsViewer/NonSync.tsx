import { useAtomValue } from "jotai";
import { NonSyncLyricsData } from "../../lib/lyrics";
import { globalConfigAtom } from "../../state/globalConfig";

export const NonSyncLyrics = (
  props: { lyrics: string },
) => {
  const globalConfig = useAtomValue(globalConfigAtom);
  return (
    <div
      className="yp-overflow-y-scroll yp-h-full yp-whitespace-pre-wrap"
      style={{
        textAlign: globalConfig.appearance.align,
      }}
    >
      {props.lyrics}
    </div>
  );
};

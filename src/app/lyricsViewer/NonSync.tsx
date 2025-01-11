import { useAtomValue } from "jotai";
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
        fontSize: globalConfig.appearance.fontSize,
      }}
    >
      <p className="yp-py-12">
        {props.lyrics}
      </p>
    </div>
  );
};

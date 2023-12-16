import { useAtom } from "jotai";
import { withImmer } from "jotai-immer";

import { useSongConfig } from "../../state/songConfig";
import { NumberForm } from "./forms";

export const SongSettings = () => {
  const [songConfig, setSongConfig] = useSongConfig()!;

  return (
    <>
      <NumberForm
        value={songConfig.offset}
        label="Offset"
        setter={(v) => {
          setSongConfig({ offset: v });
        }}
      />
    </>
  );
};

import { setSongConfig, songConfig } from "../../store";
import { NumberForm } from "./forms";

export const SongSettings = () => {
  return (
    <>
      <NumberForm
        value={songConfig.data!.offset}
        label="Align"
        setter={(v) => setSongConfig("data", "offset", v)}
      />
    </>
  );
};

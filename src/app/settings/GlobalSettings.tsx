import { useAtom } from "jotai";
import { withImmer } from "jotai-immer";

import { NumberForm, RadioForm } from "./forms";
import { globalConfigAtom } from "../../state/globalConfig";

export const GlobalConfig = () => {
  const [globalConfig, setGlobalConfig] = useAtom(withImmer(globalConfigAtom));
  return (
    <>
      <NumberForm
        value={globalConfig.appearance.opacity}
        label="Opacity"
        setter={(v) => (setGlobalConfig((s) => {
          s.appearance.opacity = v;
        }))}
      />
      <NumberForm
        value={globalConfig.appearance.fontSize}
        label="Font size"
        setter={(v) => (setGlobalConfig((s) => {
          s.appearance.fontSize = v;
        }))}
      />
      <RadioForm
        value={globalConfig.appearance.align}
        label="Align"
        options={["left", "center", "right"]}
        setter={(v) => (setGlobalConfig((s) => {
          s.appearance.align = v as any;
        }))}
      />
      <NumberForm
        value={globalConfig.behavior.offset}
        label="Global offset"
        setter={(v) => (setGlobalConfig((s) => {
          s.behavior.offset = v;
        }))}
      />
    </>
  );
};

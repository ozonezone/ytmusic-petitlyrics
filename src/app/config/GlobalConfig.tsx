import { useAtom } from "jotai";
import { withImmer } from "jotai-immer";

import { NumberForm, NumberFormWithButton, RadioForm } from "./forms";
import { globalConfigAtom } from "../../state/globalConfig";

export const GlobalConfig = () => {
  const [globalConfig, setGlobalConfig] = useAtom(withImmer(globalConfigAtom));

  return (
    <div className="yp:grid yp:grid-cols-5">
      <NumberForm
        value={globalConfig.appearance.opacity}
        label="Opacity"
        setter={(v) => (setGlobalConfig((s) => {
          s.appearance.opacity = v;
        }))}
      />
      <NumberFormWithButton
        value={globalConfig.appearance.width}
        label="Width"
        setter={(v) => (setGlobalConfig((s) => {
          if (v) {
            s.appearance.width = v;
          }
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
      <RadioForm
        value={globalConfig.behavior.syncMode}
        label="Sync"
        options={["word", "line", "none"]}
        setter={(v) => (setGlobalConfig((s) => {
          s.behavior.syncMode = v as any;
        }))}
      />
    </div>
  );
};

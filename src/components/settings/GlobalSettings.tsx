import { globalSettings, setGlobalSettings } from "../../store";
import { NumberForm, RadioForm } from "./forms";

export const GlobalSettings = () => {
  return (
    <>
      <NumberForm
        value={globalSettings.appearance.opacity}
        label="Opacity"
        setter={(v) => setGlobalSettings("appearance", "opacity", v)}
      />
      <NumberForm
        value={globalSettings.appearance.fontSize}
        label="Font size"
        setter={(v) => setGlobalSettings("appearance", "fontSize", v)}
      />
      <RadioForm
        value={globalSettings.appearance.align}
        label="Align"
        setter={(v) => setGlobalSettings("appearance", "align", v as any)}
        options={["left", "center", "right"]}
      />
      <NumberForm
        value={globalSettings.behavior.offset}
        label="Global offset"
        setter={(v) => {
          setGlobalSettings("behavior", "offset", v);
        }}
      />
    </>
  );
};

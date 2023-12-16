import { GlobalConfig } from "./GlobalSettings";
import { SongSettings } from "./SongSettings";
import { useSongConfig } from "../../state/songConfig";

export const Settings = () => {
  const songConfig = useSongConfig();

  return (
    <div className="yp-flex yp-flex-col yp-border yp-border-white yp-mt-1 yp-pb-3 yp-border-solid">
      <div>
        <h4 className="yp-bg-black yp-w-fit yp-translate-y-[-50%]">
          Config
        </h4>
      </div>
      <div className="yp-border yp-border-white yp-mb-1 yp-p-2">
        <p className="yp-bg-black yp-w-fit yp-translate-y-[-50%]">
          Global
        </p>
        <GlobalConfig />
      </div>
      {songConfig && (
        <div className="yp-border yp-border-white yp-mb-1 yp-p-2">
          <p className="yp-bg-black yp-w-fit yp-translate-y-[-50%]">
            Song
          </p>
          <SongSettings />
        </div>
      )}
    </div>
  );
};

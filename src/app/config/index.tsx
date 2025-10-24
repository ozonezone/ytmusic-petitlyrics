import { useSongConfig } from "../../state/songConfig";
import { GlobalConfig } from "./GlobalConfig";
import { SongConfig } from "./SongConfig";

export const Config = () => {
  const songConfig = useSongConfig();

  return (
    <div className="yp:flex yp:flex-col yp:border yp:border-white yp:mt-5 yp:pb-3 yp:border-solid yp:px-2">
      <h4 className="yp:bg-black yp:w-fit yp:translate-y-[-50%] yp:translate-x-2">
        Config
      </h4>
      <div className="yp:border yp:border-white yp:border-solid yp:mb-1 yp:px-2 yp:pb-2">
        <p className="yp:bg-black yp:w-fit yp:translate-y-[-50%]">
          Global
        </p>
        <GlobalConfig />
      </div>
      {songConfig && (
        <div className="yp:border yp:border-white yp:border-solid yp:pb-2 yp:px-2 yp:mt-4">
          <p className="yp:bg-black yp:w-fit yp:translate-y-[-50%]">
            Song
          </p>
          <SongConfig />
        </div>
      )}
    </div>
  );
};

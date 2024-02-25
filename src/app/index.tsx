import { useState } from "react";
import useSWR from "swr";
import { createPortal } from "react-dom";
import { clsx } from "clsx";
import { useAtom } from "jotai";

import IconLyrics from "~icons/ic/baseline-lyrics";
import IconSettings from "~icons/ic/baseline-settings";
import IconFullscreen from "~icons/ic/baseline-fullscreen";
import IconCloseSidebar from "~icons/tabler/layout-sidebar-right-collapse";

import { globalConfigAtom } from "../state/globalConfig";
import { useSongInfo } from "../state/songInfo";
import { getLyrics } from "../lib/lyrics";
import { LyricsViewer } from "./lyricsViewer";

import "./index.css";
import { useSongConfig } from "../state/songConfig";
import { Config } from "./config";
import { backend } from "../backend";

const ToolbarButton = (props: {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
}) => {
  return (
    <button
      className={clsx(
        "yp-bg-transparent yp-border-none yp-text-white yp-w-8 yp-h-8 hover:yp-bg-gray-500/50",
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export const AppIndex = (props: { controlParent: Element }) => {
  const [show, setShow] = useState(backend.basic.showByDefault);
  const [showSettings, setShowConfig] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);

  const [globalConfig] = useAtom(globalConfigAtom);

  return (
    <div>
      {createPortal(
        <button
          className={clsx("yp-h-[36px] yp-w-[36px] yp-ml-2 yp-bg-transparent yp-border-none yp-text-white yp-flex yp-justify-center yp-items-center", backend.basic.controlButtonElementClass)}
          onClick={() => {
            setShow(!show);
          }}
        >
          <IconLyrics height="20px" width="20px" />
        </button>,
        props.controlParent,
      )}
      {show && (
        <div
          className={clsx(
            "yp-flex yp-flex-col yp-fixed yp-h-full",
            "yp-top-0 yp-right-0 yp-z-[3] yp-pt-3 yp-px-3 yp-[font-size:large] yp-box-border yp-text-base",
            "yp-text-white",
            {
              "yp-w-full": fullWidth,
              "yp-w-[400px]": !fullWidth,
            },
            backend.basic.rootElementClass,
          )}
          style={{
            backgroundColor:
              `rgba(0, 0, 0, ${globalConfig.appearance.opacity})`,
          }}
        >
          <div className="yp-flex yp-flex-col yp-mb-2">
            <div className="yp-flex yp-items-center yp-border-solid yp-border-t-transparent yp-border-x-transparent yp-border-b yp-border-gray-500 yp-pb-1">
              <p className="yp-text-gray-500">petitlyrics</p>
              <ToolbarButton
                className="yp-ml-auto"
                onClick={() => {
                  setShowConfig(!showSettings);
                }}
              >
                <IconSettings width="20px" height="20px" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  setFullWidth(!fullWidth);
                }}
              >
                <IconFullscreen width="20px" height="20px" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  setShow(false);
                }}
              >
                <IconCloseSidebar width="20px" height="20px" />
              </ToolbarButton>
            </div>
            <div
              className={clsx(
                "yp-mb-2",
                showSettings ? "yp-block" : "yp-hidden",
              )}
            >
              <Config />
            </div>
          </div>
          <LyricsLoader />
        </div>
      )}
    </div>
  );
};

const Center = (props: { children: React.ReactNode }) => {
  return (
    <div className="yp-flex yp-justify-center yp-items-center yp-h-full">
      {props.children}
    </div>
  );
};

function LyricsLoader() {
  const songInfo = useSongInfo();
  const _songConfig = useSongConfig();
  const songConfig = _songConfig ? _songConfig[0] : null;

  const { data: songData, isLoading } = useSWR(
    [songInfo, songConfig],
    async ([song, config]) => {
      if (!song || !config) {
        return null;
      }
      if (!song.artist && !song.title && !song.album) {
        return null;
      }

      return await getLyrics({
        ...song,
        lyricsId: config.lyricsIdOverride ?? undefined,
      });
    },
  );

  if (isLoading) {
    return (
      <Center>
        Loading...
      </Center>
    );
  }
  if (!songData) {
    return <Center>No song</Center>;
  }
  if (songData.success) {
    return <LyricsViewer data={songData} />;
  } else {
    return (
      <div className="yp-flex yp-flex-col yp-items-center yp-justify-center yp-h-full">
        <p>
          Error
        </p>
        {songData.message.map((msg, i) => <p key={i}>{msg.toString()}</p>)}
      </div>
    );
  }
}

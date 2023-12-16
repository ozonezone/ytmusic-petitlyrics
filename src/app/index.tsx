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
import { Settings } from "./settings";

import "./index.css";

const ToolbarButton = (props: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      className="yp-bg-transparent yp-border-none yp-text-white yp-w-6 yp-h-6"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
};

export const AppIndex = (props: { controlParent: Element }) => {
  const [show, setShow] = useState(true);
  const [showSettings, setShowSettings] = useState(true);
  const [fullWidth, setFullWidth] = useState(false);

  const [globalConfig] = useAtom(globalConfigAtom);

  return (
    <div>
      {createPortal(
        <button
          className="yp-h-[36px] yp-w-[36px] yp-ml-2 yp-bg-transparent yp-border-none yp-text-white"
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
            "yp-flex yp-flex-col yp-fixed yp-h-[calc(100vh-var(--ytmusic-nav-bar-height)-var(--ytmusic-player-bar-height))]",
            "yp-top-[var(--ytmusic-nav-bar-height)] yp-right-0 yp-z-[4] yp-py-3 yp-px-3 yp-[font-size:large] yp-box-border yp-text-base",
            "yp-text-white",
            {
              "yp-w-full": fullWidth,
              "yp-w-[400px]": !fullWidth,
            },
          )}
          style={{
            backgroundColor:
              `rgba(0, 0, 0, ${globalConfig.appearance.opacity})`,
          }}
        >
          <div className="yp-flex yp-flex-col">
            <div className="yp-flex yp-items-center">
              <p style={{ color: "gray" }}>YTMusic petitlyrics</p>
              <ToolbarButton
                onClick={() => {
                  setShowSettings(!showSettings);
                }}
              >
                <IconSettings width="15px" height="15px" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  setFullWidth(!fullWidth);
                }}
              >
                <IconFullscreen width="15px" height="15px" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  setShow(false);
                }}
              >
                <IconCloseSidebar width="15px" height="15px" />
              </ToolbarButton>
            </div>
            <div
              className={clsx(
                "yp-mb-2",
                showSettings ? "yp-block" : "yp-hidden",
              )}
            >
              <Settings />
            </div>
          </div>
          <LyricsLoader />
        </div>
      )}
    </div>
  );
};

function LyricsLoader() {
  const songInfo = useSongInfo();

  const { data: songData, isLoading } = useSWR(songInfo, async (song) => {
    if (!song.artist && !song.title && !song.album) {
      return null;
    }

    return await getLyrics(song);
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!songData) {
    return <div>No song</div>;
  }
  if (songData.success) {
    return <LyricsViewer data={songData} />;
  } else {
    return (
      <div>
        Error: {songData.message.join(", ")}
      </div>
    );
  }
}

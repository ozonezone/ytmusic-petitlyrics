import { Show } from "solid-js";
import { GlobalSettings } from "./GlobalSettings";
import { songConfig } from "../../store";
import { SongSettings } from "./SongSettings";

export const Settings = () => {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        border: "1px solid white",
        "margin-top": "2px",
        "padding": "0 0 10px 5px",
      }}
    >
      <div>
        <h4
          style={{
            "transform": "translateY(-50%) translateX(1rem)",
            "background-color": "black",
            "width": "fit-content",
          }}
        >
          Config
        </h4>
      </div>
      <div
        style={{
          "border": "1px solid white",
          "margin-bottom": "2px",
          "padding": "2px",
        }}
      >
        <p
          style={{
            "transform": "translateY(-50%) translateX(1rem)",
            "background-color": "black",
            "width": "fit-content",
          }}
        >
          Global
        </p>
        <GlobalSettings />
      </div>
      <Show when={songConfig.data}>
        <div
          style={{
            "border": "1px solid white",
            "margin-bottom": "2px",
            "margin-top": "5px",
            "padding": "2px",
          }}
        >
          <p
            style={{
              "transform": "translateY(-50%) translateX(1rem)",
              "background-color": "black",
              "width": "fit-content",
            }}
          >
            Song
          </p>
          <SongSettings />
        </div>
      </Show>
    </div>
  );
};

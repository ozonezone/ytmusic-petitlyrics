import React from "react";
import ReactDOM from "react-dom/client";
import { AppIndex } from "./app";
import { Provider } from "./provider";

let count = 0;
const id = setInterval(() => {
  if (count > 30) {
    console.log("Failed to find parent element in 30 tries.");
    clearInterval(id);
    return;
  }
  const controlBefore = document.querySelector(
    "ytmusic-player-bar #like-button-renderer",
  );
  if (controlBefore) {
    clearInterval(id);

    const controlParent = document.createElement("div");
    controlBefore.after(controlParent);

    console.log("Found parent element. Initializing.");

    ReactDOM.createRoot(
      (() => {
        const parent = document.createElement("div");
        document.body.append(parent);
        return parent;
      })(),
    ).render(
      <React.StrictMode>
        <Provider>
          <AppIndex controlParent={controlParent} />
        </Provider>
      </React.StrictMode>,
    );
  } else {
    count++;
  }
}, 400);

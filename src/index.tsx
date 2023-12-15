/* @refresh reload */
import { render } from "solid-js/web";

import App from "./App";

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
    const controlParent = document.createElement("div");
    controlBefore.after(controlParent);
    console.log("Found parent element.");
    startApp(document.body, controlParent);
  } else {
    count++;
  }
}, 400);

const startApp = (parent: Element, controlParent: Element) => {
  clearInterval(id);
  render(
    () => <App controlParent={controlParent} />,
    (() => parent)(),
  );
};

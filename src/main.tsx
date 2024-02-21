import React from "react";
import ReactDOM from "react-dom/client";
import { AppIndex } from "./app";
import { Provider } from "./provider";
import { backend } from "./backend";

(async () => {
  const { control, player } = await backend.basic.init();
  ReactDOM.createRoot(
    (() => {
      const parent = document.createElement("div");
      player.append(parent);
      return parent;
    })(),
  ).render(
    <React.StrictMode>
      <Provider>
        <AppIndex controlParent={control} />
      </Provider>
    </React.StrictMode>,
  );
})();

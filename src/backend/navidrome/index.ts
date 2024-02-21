import { BackendProviderBasic } from "../type";

export const navidrome: BackendProviderBasic = {
  init: async () => {
    return new Promise((resolve) => {
      let count = 0;
      const id = setInterval(() => {
        if (count > 30) {
          console.log("Failed to find parent element in 30 tries.");
          clearInterval(id);
          return;
        }
        const controlBefore = document.querySelector(
          ".player-content .group",
        );
        const playerPage = document.querySelector("#root");
        if (controlBefore && playerPage) {
          clearInterval(id);

          const controlParent = document.createElement("div");
          controlBefore.after(controlParent);

          console.log("Found parent element. Initializing.");

          resolve({ control: controlParent, player: playerPage });
        } else {
          count++;
        }
      }, 400);
    });
  },
  rootElementClass: "yp-h-[calc(100vh-80px-2.5rem)] yp-mt-10 [&_p]:yp-m-0",
};

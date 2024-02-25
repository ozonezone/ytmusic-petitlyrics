import { BackendProviderBasic } from "../type";

export const ytmusic: BackendProviderBasic = {
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
          "ytmusic-player-bar #like-button-renderer",
        );
        const playerPage = document.getElementById("player-page");
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
  showByDefault: true
};

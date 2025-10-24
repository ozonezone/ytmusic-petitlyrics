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
          "#react-admin-title",
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
  rootElementClass: "yp:h-[calc(100vh-80px-2.5rem)] yp:mt-10 yp:[&_p]:m-0",
  controlButtonElementClass: "yp:hover:text-green-500",
  showByDefault: false
};

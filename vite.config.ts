import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import monkey from "vite-plugin-monkey";
import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

import dotenv from "dotenv";

dotenv.config();

const backend = process.env.VITE_BACKEND;
if (!backend) {
  throw new Error("VITE_BACKEND is not set");
}
const minify = process.env.MINIFY === "true";

let userscript: { namespace: string; match: string[]; name: string };
switch (backend) {
  case "ytmusic":
    userscript = {
      name: "ytmusic-petitlyrics",
      namespace: "ytmusic-petitlyrics",
      match: ["https://music.youtube.com/*"],
    };
    break;
  case "navidrome":
    const navidromeUrl = process.env.NAVIDROME_URL;
    if (!navidromeUrl) {
      throw new Error("NAVIDROME_URL is not set");
    }
    userscript = {
      name: "navidrome-petitlyrics",
      namespace: "navidrome-petitlyrics",
      match: [`${navidromeUrl}/*`],
    };
    break;
  default:
    throw new Error(`Unknown backend: ${backend}`);
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    Icons({ compiler: "jsx", jsx: "react" }),
    react(),
    monkey({
      entry: "src/main.tsx",
      userscript,
      server: { mountGmApi: true },
      build: {
        fileName: `${userscript.name}${minify ? ".min" : ""}.user.js`,
      },
    }),
    cssInjectedByJsPlugin(),
  ],
  build: {
    minify,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import monkey, { cdn } from "vite-plugin-monkey";
import Icons from "unplugin-icons/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    Icons({ compiler: "jsx", jsx: "react" }),
    react(),
    monkey({
      entry: "src/main.tsx",
      userscript: {
        namespace: "ytmusic-petitlyrics",
        match: ["https://music.youtube.com/*"],
      },
      server: { mountGmApi: true },
      build: {
        externalGlobals: {
          react: cdn.jsdelivr("React", "umd/react.production.min.js"),
          "react-dom": cdn.jsdelivr(
            "ReactDOM",
            "umd/react-dom.production.min.js",
          ),
        },
      },
    }),
    cssInjectedByJsPlugin(),
  ],
});

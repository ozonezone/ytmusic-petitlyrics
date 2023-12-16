import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import monkey, { cdn } from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    solidPlugin(),
    monkey({
      entry: "src/index.tsx",
      userscript: {
        namespace: "ytmusic-petitlyrics",
        name: "YTMusic PetitLyrics",
        match: ["https://music.youtube.com/*"],
      },
      server: { mountGmApi: true },
    }),
  ],
  build: {
    minify: true,
  },
});

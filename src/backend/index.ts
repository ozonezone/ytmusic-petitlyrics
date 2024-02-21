import { BackendProvider } from "./type";

async function getBackend() {
  let backend: BackendProvider;

  if (import.meta.env.VITE_BACKEND === "ytmusic") {
    backend = {
      basic: (await import("./ytmusic")).ytmusic,
      hooks: (await import("./ytmusic/hooks")).ytmusicHooks,
    };
  } else if (import.meta.env.VITE_BACKEND === "navidrome") {
    backend = {
      basic: (await import("./navidrome")).navidrome,
      hooks: (await import("./navidrome/hooks")).navidromeHooks,
    };
  } else {
    throw new Error(`Unknown backend: ${import.meta.env.BACKEND}`);
  }

  return backend;
}

export const backend = await getBackend();

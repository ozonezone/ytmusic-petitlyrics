import type { ComponentProps } from "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "yt-button-shape": ComponentProps<"div"> & { version: string };
      "yt-icon": ComponentProps<"div">;
      "yt-touch-feedback-shape": ComponentProps<"div">;
    }
  }
}

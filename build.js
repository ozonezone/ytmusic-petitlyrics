import shell from "shelljs";

shell.config.fatal = true;

shell.exec("A=B pnpm tsc");
shell.exec("VITE_BACKEND=ytmusic pnpm vite build");
shell.exec(
  "VITE_BACKEND=ytmusic MINIFY=true pnpm vite build --emptyOutDir=false",
);

if (process.env.NAVIDROME_URL !== undefined) {
  console.log("Building Navidrome backend...");

  shell.exec("VITE_BACKEND=navidrome pnpm vite build --emptyOutDir=false");
  shell.exec(
    "VITE_BACKEND=navidrome MINIFY=true pnpm vite build --emptyOutDir=false",
  );
} else {
  console.log("Skipping Navidrome backend build...");
}

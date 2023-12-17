/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      sm: "small",
      base: "medium",
      md: "medium",
      lg: "large",
      xl: "x-large",
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
  prefix: "yp-",
};

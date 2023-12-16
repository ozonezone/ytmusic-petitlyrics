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
      xl: "large",
    },
  },
  plugins: [],
  prefix: "yp-",
};

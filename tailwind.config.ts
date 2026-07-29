import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2a2925",
        mist: "#f2eadf",
        paper: "#fffaf3",
        linen: "#f6efe4",
        pine: "#1f6f5b",
        amberSoft: "#f7c56b",
        coral: "#de6b5f",
        skySoft: "#d9ecff"
      },
      boxShadow: {
        soft: "0 18px 42px rgba(83, 62, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

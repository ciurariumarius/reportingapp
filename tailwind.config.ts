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
        digital: {
          DEFAULT: "#1c435e",
          ink: "#102636",
          mist: "#eef5f8"
        }
      },
      boxShadow: {
        soft: "0 14px 40px rgba(16, 38, 54, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// GitHub project Pages: https://duykhang132005.github.io/Personal_Projects_grove/
const PAGES_BASE = "/Personal_Projects_grove/"

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev stays at /; production build defaults to the Pages project path.
  // Override anytime with VITE_BASE (e.g. VITE_BASE=/ for a custom root host).
  base: process.env.VITE_BASE || (command === "build" ? PAGES_BASE : "/"),
}))

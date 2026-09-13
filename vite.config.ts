import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Set VITE_BASE=/repo-name/ for GitHub project pages.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "./", // Ensures relative paths for assets in production
    build: {
        outDir: "dist", // Match your Electron build configuration
    },
    plugins: [react()],
    server: {
        port: 5173, // Default Vite port
    },
});

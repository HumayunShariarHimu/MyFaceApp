import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/MyFaceApp/' : '/',
  server: {
    allowedHosts: ['5173-i0oauaw1sp0r27q92dc86-8714e340.us5.manus.computer'],
  },
  build: {
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          faceRecognition: ['@vladmandic/face-api'],
          mediapipe: ['@mediapipe/tasks-vision'],
          three: ['three'],
        },
      },
    },
  },
});

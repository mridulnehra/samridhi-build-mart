import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/*.png'],
            manifest: {
                name: 'Smridhi BuildMart',
                short_name: 'BuildMart',
                description: 'Your Trusted Interlock Partner - Factory Management Made Simple',
                start_url: '/',
                display: 'standalone',
                background_color: '#FAF6F1',
                theme_color: '#CD5C5C',
                orientation: 'portrait-primary',
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                // Network-first strategy for API calls — always try network, fall back to cache
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'supabase-api',
                            expiration: { maxEntries: 50, maxAgeSeconds: 300 },
                            networkTimeoutSeconds: 10,
                        },
                    },
                    {
                        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif)$/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'static-assets',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
                        },
                    },
                ],
                // Skip waiting ensures new service worker activates immediately
                skipWaiting: true,
                clientsClaim: true,
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

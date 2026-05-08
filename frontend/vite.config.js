import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        role: resolve(__dirname, 'role.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        booking: resolve(__dirname, 'booking.html'),
        home: resolve(__dirname, 'home.html'),
        roomDetail: resolve(__dirname, 'room-detail.html'),
        search: resolve(__dirname, 'search.html'),
        ownerAppIndex: resolve(__dirname, 'owner-app/index.html'),
        ownerAppDashboard: resolve(__dirname, 'owner-app/dashboard.html'),
        ownerAppOrders: resolve(__dirname, 'owner-app/orders.html'),
        ownerAppProperties: resolve(__dirname, 'owner-app/properties.html'),
        ownerAppRooms: resolve(__dirname, 'owner-app/rooms.html'),
        userAppHome: resolve(__dirname, 'user-app/home.html'),
        userAppBooking: resolve(__dirname, 'user-app/booking.html'),
        userAppRoomDetail: resolve(__dirname, 'user-app/room-detail.html'),
        userAppSearch: resolve(__dirname, 'user-app/search.html'),
      },
    },
  },
});

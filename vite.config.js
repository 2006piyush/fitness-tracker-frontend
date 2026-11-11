import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://fitness-tracker-6pgi.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
};
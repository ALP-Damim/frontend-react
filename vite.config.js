import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const wsTarget = (env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws').replace(/\/ws$/, '')
  const apimKey = env.VITE_APIM_SUBSCRIPTION_KEY
  const apiTarget = env.VITE_API_BASE_URL || 'https://team02-apim.azure-api.net/student'

  return {
    plugins: [react()],
    server: {
      // 프록시 설정 비활성화 (직접 연결 사용)
      // proxy: {
      //   '/api': {
      //     target: apiTarget,
      //     changeOrigin: true,
      //     secure: true,
      //     rewrite: (path) => path.replace(/^\/api/, ''),
      //     headers: apimKey ? { 'Ocp-Apim-Subscription-Key': apimKey } : undefined,
      //   },
      //   '/ws': {
      //     target: wsTarget,
      //     changeOrigin: true,
      //     ws: true,
      //     secure: true,
      //     // 일부 환경에서 WS 업그레이드 시 headers 옵션이 적용되지 않을 수 있어 이벤트로도 주입
      //     configure: (proxy) => {
      //       proxy.on('proxyReqWs', (proxyReq) => {
      //         if (apimKey) proxyReq.setHeader('Ocp-Apim-Subscription-Key', apimKey)
      //       })
      //     },
      //     headers: apimKey ? { 'Ocp-Apim-Subscription-Key': apimKey } : undefined,
      //   },
      // },
    },
  }
})

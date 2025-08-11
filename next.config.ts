import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow cross-origin requests from network IPs
  allowedDevOrigins: [
    '192.168.180.1',
    '192.168.1.0/24',    // Allow entire local network range
    '192.168.0.0/24',    // Common router range
    '10.0.0.0/24',       // Another common range
  ],
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    
    // Suppress Supabase realtime WebSocket warning
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

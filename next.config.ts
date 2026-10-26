import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 과목 자료실 파일 업로드 (PDF, 슬라이드 등)
    serverActions: { bodySizeLimit: "20mb" },
  },
};

export default nextConfig;

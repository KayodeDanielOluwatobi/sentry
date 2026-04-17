import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow connections from your mobile device IP to prevent NextJS overriding and blocking dev tools
  allowedDevOrigins: ['192.168.170.194'],
  allowedDevOrigins: ['192.168.151.214'],
};

export default nextConfig;

import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.icons8.com",
        pathname: "/win10/512/**",
      },
    ],
  },
  // webpack: (config) => {
  //   config.resolve.alias["@/"] = path.resolve(__dirname, "src/");
  //   return config;
  // },
};

export default nextConfig;

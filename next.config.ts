import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Loaded from node_modules at run time rather than bundled: libheif ships
  // WebAssembly and busboy/exifr are plain Node packages (sharp is external by default).
  serverExternalPackages: ["heic-decode", "libheif-js", "busboy", "exifr"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;

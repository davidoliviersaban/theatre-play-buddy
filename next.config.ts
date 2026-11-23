import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@prisma/client', '@prisma/engines', 'pdf-parse', 'pdfjs-dist'],
};

export default nextConfig;

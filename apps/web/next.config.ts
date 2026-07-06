import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads the i18n request config from src/i18n/request.ts (plugin default).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default withNextIntl(nextConfig);

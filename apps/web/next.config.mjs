/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@workspace/ui"],
  experimental: {
    inlineCss: true,
    ppr: true,
    // Forward browser logs to the terminal for easier debugging
    browserDebugInfoInTerminal: true,

    // Enable new caching and pre-rendering behavior
    cacheComponents: true,

    // Activate new client-side router improvements
    clientSegmentCache: true,

    // Explore route composition and segment overrides via DevTools
    devtoolSegmentExplorer: true,

    // Enable persistent caching for the turbopack dev server and build.
    turbopackPersistentCaching: true,

    // enable HMR for server components for local development (HMR = hot module replacement)
    serverComponentsHmrCache: true,

  }
}

export default nextConfig

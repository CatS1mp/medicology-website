import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));

/** Extra hosts for `next/image` (comma-separated, no protocol). */
function extraImageRemoteHosts(): Array<{ protocol: "https"; hostname: string }> {
  const out: Array<{ protocol: "https"; hostname: string }> = [];
  const push = (hostname: string) => {
    const h = hostname.trim().toLowerCase();
    if (!h || out.some((x) => x.hostname === h)) return;
    out.push({ protocol: "https", hostname: h });
  };

  for (const part of (process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTS ?? "").split(",")) {
    push(part);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    try {
      push(new URL(supabaseUrl).hostname);
    } catch {
      /* ignore */
    }
  }

  push(process.env.NEXT_PUBLIC_DICTIONARY_SUPABASE_HOST ?? "");

  return out;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: appRoot,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pttagaddlwsmrflahzvr.supabase.co",
      },
      ...extraImageRemoteHosts(),
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

/**
 * MovieBox Stream Proxy — Deploy on Deno Deploy (deno.dev)
 * URL: https://your-project.deno.dev/play?subjectId=...&se=...&ep=...&detailPath=...
 * 
 * Deploy steps:
 * 1. Go to https://dash.deno.com/new_project
 * 2. Link to your GitHub repo OR use "Playground" and paste this code
 * 3. Copy your .deno.dev URL and paste in msr-worker.js as MB_PROXY_URL
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);

  // Health check
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", service: "MovieBox Proxy (Deno)" }), {
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }

  // /play endpoint — proxies MovieBox subject/play API
  if (url.pathname === "/play") {
    const subjectId = url.searchParams.get("subjectId") || "";
    const se = url.searchParams.get("se") || "0";
    const ep = url.searchParams.get("ep") || "0";
    const detailPath = url.searchParams.get("detailPath") || subjectId;

    if (!subjectId) {
      return new Response(JSON.stringify({ error: "Missing subjectId" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    const exactReferer = `https://movie-box.co/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;

    const playParams = new URLSearchParams({
      subjectId,
      se,
      ep,
      detailPath,
      streamSignType: "1",
      "supportCodecs[hevc]": "1",
      "supportCodecs[h264]": "1"
    });

    const playUrl = `https://movie-box.co/wefeed-h5api-bff/subject/play?${playParams.toString()}`;

    try {
      const res = await fetch(playUrl, {
        headers: {
          "User-Agent": "com.community.mbox.in/50020126 (Linux; U; Android 14; en_IN; Pixel 8; Build/UD1A.230803.041; Cronet/145.0.7582.0)",
          "x-client-info": JSON.stringify({
            package_name: "com.community.mbox.in",
            version_name: "4.0.02.0831.03",
            version_code: 50020126,
            os: "android",
            os_version: "14",
            install_ch: "official",
            device_id: "862590048123456"
          }),
          "x-client-status": JSON.stringify({ timezone: "Asia/Calcutta" }),
          "x-request-lang": "en",
          "x-vip-restrict": "0",
          "x-no-high-risk-restrict": "0",
          "Accept": "application/json",
          "Referer": exactReferer,
          "Origin": "https://movie-box.co"
        }
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502, headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
  }

  return new Response("Not Found", { status: 404, headers: CORS });
});


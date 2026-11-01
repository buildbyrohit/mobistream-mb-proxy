import https from "https";
import http from "http";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const target = req.query.url;
  if (!target) {
    return res.status(400).send("Missing url param");
  }

  const reqHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://movie-box.co/",
    "Origin": "https://movie-box.co"
  };

  if (req.headers.range) {
    reqHeaders["Range"] = req.headers.range;
  }

  const client = target.startsWith("https") ? https : http;

  const proxyReq = client.get(target, { headers: reqHeaders }, (originRes) => {
    if ([301, 302, 307, 308].includes(originRes.statusCode) && originRes.headers.location) {
      return client.get(originRes.headers.location, { headers: reqHeaders }, (redirectRes) => {
        res.writeHead(redirectRes.statusCode, {
          ...redirectRes.headers,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges"
        });
        redirectRes.pipe(res);
      });
    }

    res.writeHead(originRes.statusCode, {
      ...originRes.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges"
    });
    originRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    if (!res.headersSent) {
      res.status(502).send("Proxy error: " + err.message);
    }
  });

  req.on("close", () => {
    proxyReq.destroy();
  });
}

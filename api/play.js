export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { subjectId, se = "0", ep = "0", detailPath } = req.query;
  if (!subjectId) return res.status(400).json({ error: "Missing subjectId" });

  const dp = detailPath || subjectId;
  const referer = `https://movie-box.co/movies/${dp}?id=${subjectId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;
  const params = new URLSearchParams({ subjectId, se, ep, detailPath: dp, streamSignType: "1", "supportCodecs[hevc]": "1", "supportCodecs[h264]": "1" });
  const playUrl = `https://movie-box.co/wefeed-h5api-bff/subject/play?${params}`;

  try {
    const mbRes = await fetch(playUrl, {
      headers: {
        "User-Agent": "com.community.mbox.in/50020126 (Linux; U; Android 14; en_IN; Pixel 8; Build/UD1A.230803.041; Cronet/145.0.7582.0)",
        "x-client-info": JSON.stringify({ package_name: "com.community.mbox.in", version_name: "4.0.02.0831.03", version_code: 50020126, os: "android", os_version: "14", install_ch: "official", device_id: "862590048123456" }),
        "x-client-status": JSON.stringify({ timezone: "Asia/Calcutta" }),
        "x-request-lang": "en", "x-vip-restrict": "0", "x-no-high-risk-restrict": "0",
        "Accept": "application/json", "Referer": referer, "Origin": "https://movie-box.co"
      }
    });
    const data = await mbRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}

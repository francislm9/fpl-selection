// Netlify serverless function — runs on Netlify's servers, not the browser,
// so there's no CORS restriction and no dependency on flaky public proxies.
exports.handler = async function (event) {
  const path = event.queryStringParameters && event.queryStringParameters.path;

  if (!path) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'path' query parameter" })
    };
  }

  // Only allow paths under the official FPL API to prevent this function
  // from being abused as an open proxy.
  const allowedPrefixes = [
    "/bootstrap-static/",
    "/entry/",
    "/leagues-classic/",
    "/fixtures/",
    "/event/"
  ];
  if (!allowedPrefixes.some((p) => path.startsWith(p))) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Path not allowed" })
    };
  }

  const target = "https://fantasy.premierleague.com/api" + path;

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FPLXIPicker/1.0)",
        Accept: "application/json"
      }
    });

    const text = await res.text();

    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Upstream fetch failed", detail: String(err) })
    };
  }
};
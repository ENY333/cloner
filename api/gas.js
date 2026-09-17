function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function gasUrl() {
  const value = process.env.GAS_API_URL;
  if (!value) throw new Error("GAS_API_URL is not configured.");
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("GAS_API_URL must use HTTPS.");
  return url.toString();
}

async function fetchGas(url, options = {}) {
  try {
    return await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      ...options
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error("Google Apps Script không phản hồi trong 15 giây.");
    }
    throw error;
  }
}

async function handler(req) {
  try {
    const base = new URL(gasUrl());

    const method = (req.method || "GET").toUpperCase();

    if (method === "GET") {
      const incoming = new URL(req.url);
      incoming.searchParams.forEach((value, key) => base.searchParams.set(key, value));
      const r = await fetchGas(base.toString());
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch {
        const isGoogleLogin = /accounts\.google\.com|ServiceLogin|signin/i.test(text);
        data = isGoogleLogin
          ? { ok:false, error:"Google Apps Script đang yêu cầu đăng nhập. Hãy deploy Web App với quyền truy cập công khai và đặt URL /exec vào GAS_API_URL." }
          : { ok:false, error:"Google Apps Script không trả về JSON hợp lệ." };
      }
      return json(data, data.ok === false && r.ok ? 502 : r.status);
    }

    if (method === "POST") {
      let body = {};
      try { body = await req.json(); } catch {}
      const r = await fetchGas(base.toString(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch {
        const isGoogleLogin = /accounts\.google\.com|ServiceLogin|signin/i.test(text);
        data = isGoogleLogin
          ? { ok:false, error:"Google Apps Script đang yêu cầu đăng nhập. Hãy deploy Web App với quyền truy cập công khai và đặt URL /exec vào GAS_API_URL." }
          : { ok:false, error:"Google Apps Script không trả về JSON hợp lệ." };
      }
      return json(data, data.ok === false && r.ok ? 502 : r.status);
    }

    return json({ok:false,error:"Method not allowed"},405);
  } catch (e) {
    return json({ok:false,error:e?.message||"Internal server error"},500);
  }
}

export default { fetch: handler };

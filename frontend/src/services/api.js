const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8001").replace(/\/$/, "");

export async function fetchPredictions() {
  const res = await fetch(`${API_BASE}/predictions`);
  if (!res.ok) throw new Error(`Failed to fetch predictions (${res.status})`);
  return res.json();
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) return { status: "waking_up", code: res.status };
    return await res.json();
  } catch {
    return { status: "sleeping_or_offline" };
  }
}

export async function predictVideo(file, maxRetries = 3) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/predict/video`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }

      // Handle 502 / 503 / 504 Gateway errors during Render container wake-up
      if ([502, 503, 504].includes(res.status) && attempt < maxRetries) {
        attempt++;
        const delay = attempt * 3500;
        console.warn(`[AuthentiScan] Backend waking up (HTTP ${res.status}). Retrying in ${delay / 1000}s (Attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Parse error JSON if returned by API
      let errMsg = `Server returned status ${res.status}`;
      try {
        const errData = await res.json();
        if (errData && errData.error) {
          errMsg = errData.error;
        } else if (errData && errData.detail) {
          errMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        if (res.status === 502) {
          errMsg = "Backend service is currently waking up from cold-start on Render Free Tier. Please click Retry in a few seconds.";
        } else {
          errMsg = `Server error (${res.status}): ${res.statusText || "Service unavailable"}`;
        }
      }

      throw new Error(errMsg);
    } catch (err) {
      const isNetworkError = err.message.includes("fetch") || err.message.includes("network") || err.name === "TypeError";
      if (isNetworkError && attempt < maxRetries) {
        attempt++;
        const delay = attempt * 3500;
        console.warn(`[AuthentiScan] Network/Wakeup retry ${attempt}/${maxRetries} in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export async function fetchPredictionById(id) {
  const res = await fetch(`${API_BASE}/predictions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch prediction #${id} (${res.status})`);
  return res.json();
}
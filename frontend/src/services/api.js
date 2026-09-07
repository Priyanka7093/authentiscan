const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8001").replace(/\/$/, "");

export async function fetchPredictions() {
  const res = await fetch(`${API_BASE}/predictions`);
  if (!res.ok) throw new Error(`Failed to fetch predictions (${res.status})`);
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function predictVideo(file, retries = 1) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/predict/video`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errMsg = `Failed to analyze video (${res.status})`;
      try {
        const errData = await res.json();
        if (errData && errData.detail) {
          errMsg = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
        }
      } catch {
        errMsg = `Server error (${res.status}): ${res.statusText || 'Service currently waking up or unavailable'}`;
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err) {
    if (retries > 0 && (err.message.includes("fetch") || err.message.includes("network") || err.name === "TypeError")) {
      console.warn("Retrying video analysis after brief delay (service waking up)...");
      await new Promise((r) => setTimeout(r, 2500));
      return predictVideo(file, retries - 1);
    }
    throw err;
  }
}

export async function fetchPredictionById(id) {
  const res = await fetch(`${API_BASE}/predictions/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch prediction #${id} (${res.status})`);
  return res.json();
}
const API_BASE = "http://localhost:8001";

export async function fetchPredictions() {
  const res = await fetch(`${API_BASE}/predictions`);
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Failed to fetch health");
  return res.json();
}
export async function predictVideo(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/predict/video`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to analyze video");
  }

  return res.json();
}

export async function fetchPredictionById(id) {
  const res = await fetch(`${API_BASE}/predictions/${id}`);
  if (!res.ok) throw new Error("Failed to fetch prediction");
  return res.json();
}
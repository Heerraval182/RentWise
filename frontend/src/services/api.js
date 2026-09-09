const API_BASE = "http://localhost:8000/api";

export async function uploadAgreement(file) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: form,
  });

  let data = {};
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    throw new Error(data.detail || "RentWise couldn't connect to the analysis service.");
  }
  return data;
}

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

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

export async function askAgreement(documentId, question) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "RentWise could not answer that question.");
  return data;
}

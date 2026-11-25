const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function uploadAgreement(file, location = "") {
  const form = new FormData();
  form.append("file", file);
  if (location.trim()) form.append("location", location.trim());

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

export async function explainClause(clause, category) {
  const response = await fetch(`${API_BASE}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clause, category }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "RentWise could not explain that clause.");
  return data;
}

export async function getChecklist(documentId) {
  const response = await fetch(`${API_BASE}/checklist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, question: "checklist" }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "RentWise could not build your checklist.");
  return data;
}

export async function compareAgreement(documentId, file) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_BASE}/compare?document_id=${encodeURIComponent(documentId)}`, { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "RentWise could not compare that agreement.");
  return data;
}

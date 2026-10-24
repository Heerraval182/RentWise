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

// Property CRUD API
export async function getProperties({ listing_type = "", city = "", status = "", search = "" } = {}) {
  const params = new URLSearchParams();
  if (listing_type) params.append("listing_type", listing_type);
  if (city) params.append("city", city);
  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE}/properties${query}`);
  const data = await response.json().catch(() => ({ properties: [] }));
  if (!response.ok) throw new Error(data.detail || "Failed to fetch properties.");
  return data.properties || [];
}

export async function getProperty(id) {
  const response = await fetch(`${API_BASE}/properties/${id}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Failed to fetch property details.");
  return data;
}

export async function createProperty(propertyData) {
  const response = await fetch(`${API_BASE}/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(propertyData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Failed to create property listing.");
  return data;
}

export async function updateProperty(id, propertyData) {
  const response = await fetch(`${API_BASE}/properties/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(propertyData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Failed to update property listing.");
  return data;
}

export async function deleteProperty(id) {
  const response = await fetch(`${API_BASE}/properties/${id}`, {
    method: "DELETE",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Failed to delete property listing.");
  return data;
}

// Broker API
export async function matchProperties(criteria) {
  const response = await fetch(`${API_BASE}/broker/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(criteria),
  });
  const data = await response.json().catch(() => ({ results: [] }));
  if (!response.ok) throw new Error(data.detail || "Failed to match properties.");
  return data;
}

export async function getBrokerLeads() {
  const response = await fetch(`${API_BASE}/broker/leads`);
  const data = await response.json().catch(() => ({ leads: [] }));
  if (!response.ok) throw new Error(data.detail || "Failed to fetch broker leads.");
  return data.leads || [];
}

export async function createBrokerLead(leadData) {
  const response = await fetch(`${API_BASE}/broker/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Failed to save client requirement.");
  return data;
}

export async function deleteBrokerLead(id) {
  const response = await fetch(`${API_BASE}/broker/leads/${id}`, {
    method: "DELETE",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Failed to delete broker lead.");
  return data;
}

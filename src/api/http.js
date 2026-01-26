const API_BASE = "/osori";

function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const reqHeaders = { ...headers };

  if (body && !(body instanceof FormData)) {
    reqHeaders["Content-Type"] = reqHeaders["Content-Type"] || "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const err = new Error("API_ERROR");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}


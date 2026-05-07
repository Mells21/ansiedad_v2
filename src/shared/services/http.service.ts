const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function parseResponse<T>(response: Response, method: string, url: string): Promise<T> {
  if (!response.ok) {
    let message = `Error al ${method} ${url}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore invalid JSON from the API and keep the default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function httpGet<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  return parseResponse<T>(response, "obtener", url);
}

export async function httpPost<TBody, TResponse>(url: string, body: TBody): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse<TResponse>(response, "enviar", url);
}

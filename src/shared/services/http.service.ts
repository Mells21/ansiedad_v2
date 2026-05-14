const configuredApiBase = import.meta.env.VITE_API_URL?.trim();

function buildApiBaseCandidates() {
  const candidates = [
    configuredApiBase,
    "/api",
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(candidates));
}

async function requestWithFallback(url: string, init?: RequestInit): Promise<Response> {
  const bases = buildApiBaseCandidates();
  let lastResponse: Response | null = null;
  let lastError: Error | null = null;

  for (const base of bases) {
    try {
      const response = await fetch(`${base}${url}`, init);
      if (response.ok) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("No se pudo conectar con la API.");
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError ?? new Error("No se pudo conectar con la API.");
}

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
  const response = await requestWithFallback(url);
  return parseResponse<T>(response, "obtener", url);
}

export async function httpPost<TBody, TResponse>(url: string, body: TBody): Promise<TResponse> {
  const response = await requestWithFallback(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse<TResponse>(response, "enviar", url);
}

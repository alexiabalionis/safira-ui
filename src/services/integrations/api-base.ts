const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production"
    ? "https://safira.ailog.com.br"
    : "http://localhost:3333");

const INTERNAL_API_BASE_URL =
  process.env.SAFIRA_API_INTERNAL_URL?.replace(/\/$/, "") ??
  (process.env.NODE_ENV === "production"
    ? "https://safira.ailog.com.br/api"
    : null);

const API_BASE_URL =
  typeof window === "undefined" && INTERNAL_API_BASE_URL
    ? INTERNAL_API_BASE_URL
    : PUBLIC_API_BASE_URL;

const REQUEST_TIMEOUT_MS = 15000;

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  if (!response.ok) {
    let message = `Erro na requisicao (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep fallback message.
    }

    if (
      typeof window !== "undefined" &&
      (response.status === 401 || response.status === 403) &&
      path !== "/api/auth/login" &&
      path !== "/api/auth/logout"
    ) {
      window.dispatchEvent(
        new CustomEvent("safira:auth-error", {
          detail: { status: response.status, path, message },
        }),
      );
    }

    throw new ApiRequestError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

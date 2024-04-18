import { authFetch } from "./authenticatedFetch";

export async function request<T>(
  url: `/${string}`,
  options?: Partial<{
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    params?: Record<string, string>;
    body?: Record<string, any>;
    version: number;
  }>
): Promise<T | null> {
  const { method = "GET", params, body = null, version = 1 } = options ?? {};

  const queryString = new URLSearchParams(params).toString();
  const urlWithParams = `${process.env.NEXT_PUBLIC_API_URL}/v${version}${url}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await authFetch(urlWithParams, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body && ["POST", "PUT", "PATCH"].includes(method)
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const data = await response.text();

  if (!response.ok) {
    console.error(data);
    return null;
  }

  const parsed = JSON.parse(data) as T;

  return parsed;
}

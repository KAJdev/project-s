import { authFetch } from "./authenticatedFetch";

export type APIError = {
  status: number;
  message: string;
  description: string;
};

export async function request<T>(
  url: `/${string}`,
  options?: Partial<{
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    params?: Record<string, string>;
    body?: Record<string, any>;
    version: number;
    throwErrors: boolean;
  }>
): Promise<T | null> {
  const { method = "GET", params, body = null, version = 1 } = options ?? {};

  const queryString = new URLSearchParams(params).toString();
  const urlWithParams = `${process.env.NEXT_PUBLIC_API_URL}/v${version}${url}${
    queryString ? `?${queryString}` : ""
  }`;

  let response: Response;
  let data: string | null = null;
  try {
    response = await authFetch(urlWithParams, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body && ["POST", "PUT", "PATCH"].includes(method)
        ? { body: JSON.stringify(body) }
        : {}),
    });

    data = await response.text();
  } catch (e) {
    console.error(e);
    return null;
  }

  if (!response.ok) {
    // attempt to get an APIError
    let error: APIError;
    try {
      error = JSON.parse(data);
    } catch (e) {
      console.error(e);
      return null;
    }

    if (options?.throwErrors) {
      throw new Error(error.message);
    } else {
      return null;
    }
  }

  const parsed = JSON.parse(data) as T;

  return parsed;
}

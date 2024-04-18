import { tokenStore } from "./token";

export const authFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `${tokenStore.getState().token}`);

  return fetch(input, { ...init, headers });
};

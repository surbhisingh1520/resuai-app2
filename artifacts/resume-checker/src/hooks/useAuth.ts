import { setAuthTokenGetter } from "@workspace/api-client-react";

export function initAuthTokenGetter() {
  setAuthTokenGetter(() => localStorage.getItem("auth_token"));
}

export function saveAuthToken(token: string) {
  localStorage.setItem("auth_token", token);
  initAuthTokenGetter();
}

export function clearAuthToken() {
  localStorage.removeItem("auth_token");
  setAuthTokenGetter(() => null);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

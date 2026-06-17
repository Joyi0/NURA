"use client";

const key = "nura-admin-password";

export function readAdminPassword() {
  try {
    return window.localStorage?.getItem(key) || "";
  } catch {
    return "";
  }
}

export function rememberAdminPassword(password: string) {
  try {
    window.localStorage?.setItem(key, password);
  } catch {
    // Embedded browsers may disable localStorage; the typed password still works for the current action.
  }
}

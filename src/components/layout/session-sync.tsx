"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useHirfa } from "@/lib/store";

/**
 * Pulls the server session into the client store once per page load.
 *
 * The cookie is httpOnly, so the browser cannot read it directly — this is
 * the only thing that tells the UI who is signed in. Until it answers,
 * `sessionChecked` stays false and the guards render a skeleton rather than
 * flashing "please log in" at an already-authenticated user.
 */
export function SessionSync() {
  const setSessionUser = useHirfa((s) => s.setSessionUser);
  const setSessionChecked = useHirfa((s) => s.setSessionChecked);

  useEffect(() => {
    let cancelled = false;

    const check = () => {
      api.me().then((result) => {
        if (cancelled) return;
        if (result.ok) setSessionUser(result.data.user);
        else setSessionChecked(true);
      });
    };

    check();

    // A session can end while the tab sits in the background — it expires, an
    // admin removes the account, or the person signs out elsewhere. Re-asking
    // on focus keeps the UI from showing a signed-in shell over a dead cookie.
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setSessionUser, setSessionChecked]);

  return null;
}

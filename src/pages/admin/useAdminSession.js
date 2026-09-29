import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
export function useAdminSession() {
  const [state, setState] = useState({
    loading: Boolean(supabase),
    session: null,
    allowed: false,
    error: "",
  });
  useEffect(() => {
    if (!supabase) return;
    let current = true;
    let revision = 0;
    async function verify(session) {
      const request = ++revision;
      if (!session) {
        if (current)
          setState({
            loading: false,
            session: null,
            allowed: false,
            error: "",
          });
        return;
      }
      const { data, error } = await supabase.rpc("is_admin");
      if (current && request === revision)
        setState({
          loading: false,
          session,
          allowed: data === true,
          error: error
            ? "Unable to verify access. Please sign out and try again."
            : "",
        });
    }
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Run database work after the Auth callback releases its internal lock.
        setTimeout(() => {
          if (current) void verify(session);
        }, 0);
      },
    );
    return () => {
      current = false;
      revision++;
      listener.subscription.unsubscribe();
    };
  }, []);
  return state;
}

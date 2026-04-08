import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setApiToken } from "../lib/api";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function toAuthError(error, fallbackMessage) {
  return {
    message: error?.response?.data?.message || error?.message || fallbackMessage,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(hasSupabaseConfig);

  async function hydrate(accessToken) {
    setApiToken(accessToken);
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setAuthMessage("");
      return { data: data.user, error: null };
    } catch (error) {
      const authError = toAuthError(error, "Login failed");
      setApiToken(null);
      setUser(null);
      setAuthMessage(authError.message);
      return { data: null, error: authError };
    }
  }

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session || null;
      setSession(currentSession);
      if (currentSession?.access_token) {
        const hydrated = await hydrate(currentSession.access_token);
        if (hydrated.error) {
          setSession(null);
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession || null);
      if (currentSession?.access_token) {
        const hydrated = await hydrate(currentSession.access_token);
        if (hydrated.error) {
          setSession(null);
          await supabase.auth.signOut();
        }
      }
      else {
        setApiToken(null);
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      authMessage,
      loading,
      clearAuthMessage: () => setAuthMessage(""),
      login: async (email, password) => {
        if (!supabase) return { error: { message: "Missing Supabase frontend env variables" } };
        setAuthMessage("");
        const result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) return result;

        if (result.data.session?.access_token) {
          const hydrated = await hydrate(result.data.session.access_token);
          if (hydrated.error) {
            await supabase.auth.signOut();
            return hydrated;
          }
        }

        return { error: null };
      },
      logout: async () => {
        setSession(null);
        setUser(null);
        setApiToken(null);
        setAuthMessage("");
        if (!supabase) return { error: null };
        return supabase.auth.signOut();
      },
    }),
    [session, user, authMessage, loading]
  );

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-red-700">Frontend configuration missing</h1>
          <p className="mt-2 text-sm text-slate-700">
            Create <code>frontend/.env</code> with <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code>, then restart <code>npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

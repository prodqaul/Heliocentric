import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  getStoredToken,
  loginRequest,
  setStoredToken,
  signupRequest,
  type AuthUser,
} from "../services/auth";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  profile: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        setStoredToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    setStoredToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await signupRequest(input);
    setStoredToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    setStoredToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getStoredToken()) return;
    const me = await fetchMe();
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile: user,
      loading,
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, loading, login, signup, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

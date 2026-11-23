"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin" | "moderator";
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  nid?: {
    front?: string;
    back?: string;
    verified?: boolean;
  };
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean; push?: boolean };
    privacy?: { profileVisibility?: "public" | "private"; dataSharing?: boolean };
  };
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ME_API = "/api/v1/auth/me";
const REFRESH_API = "/api/v1/auth/refresh-token";
const SIGNOUT_API = "/api/v1/auth/signout";
const AUTH_USER_KEY = "authUser";

async function fetchCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(ME_API, {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.user ?? null;
  } catch {
    return null;
  }
}

async function refreshSession(): Promise<User | null> {
  try {
    const response = await fetch(REFRESH_API, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.data?.user ?? null;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const clearLocalAuth = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_USER_KEY);
      // Remove tokens stored by older versions of the app.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }, []);

  const persistUser = useCallback((userData: User | null) => {
    setUser(userData);
    if (typeof window === "undefined") return;
    if (userData) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, []);

  // Restore the session from the httpOnly cookie. If the short-lived access
  // cookie has expired, the refresh cookie rotates it automatically.
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const cached = localStorage.getItem(AUTH_USER_KEY);
        if (cached) {
          try {
            setUser(JSON.parse(cached) as User);
          } catch {
            localStorage.removeItem(AUTH_USER_KEY);
          }
        }

        let currentUser = await fetchCurrentUser();
        if (!currentUser) currentUser = await refreshSession();

        if (cancelled) return;

        if (currentUser) {
          persistUser(currentUser);
        } else {
          clearLocalAuth();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (!cancelled) clearLocalAuth();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      cancelled = true;
    };
  }, [clearLocalAuth, persistUser]);

  // Periodically revalidate the session while the user is active.
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      let currentUser = await fetchCurrentUser();
      if (!currentUser) currentUser = await refreshSession();

      if (currentUser) {
        persistUser(currentUser);
      } else {
        clearLocalAuth();
        toast.error("Session expired. Please sign in again.");
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, clearLocalAuth, persistUser]);

  const login = async (userData: User): Promise<boolean> => {
    try {
      if (!userData?.id) {
        toast.error("Invalid authentication response");
        return false;
      }

      persistUser(userData);
      toast.success("Successfully signed in!");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in");
      return false;
    }
  };

  const logout = () => {
    // Clear the httpOnly cookies server-side. Local state is cleared even if
    // the request fails (e.g. the network is offline).
    fetch(SIGNOUT_API, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Signout API error:", err));

    clearLocalAuth();
    toast.success("Successfully signed out");
    router.push("/auth/signin");
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    persistUser(updatedUser);
    toast.success("Profile updated successfully");
  };

  const refreshToken = async (): Promise<boolean> => {
    const refreshedUser = await refreshSession();
    if (!refreshedUser) {
      clearLocalAuth();
      return false;
    }
    persistUser(refreshedUser);
    return true;
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    updateUser,
    refreshToken,
    loading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

import React, { createContext, useContext, useEffect, useState } from "react";
import { getProfile, loginApi, registerApi, Profile, AppRole, API_URL } from "@/lib/api";

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  role: AppRole;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (data: { email: string; password?: string; fullName: string; department: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: "employee",
  loading: true,
  signOut: async () => {},
  signIn: async () => {},
  signUp: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>("employee");
  const [loading, setLoading] = useState(true);

  const fetchUserAndProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        const { user: u, profile: p } = await res.json();
        setUser(u);
        setProfile(p);
        setRole(u.role as AppRole);
      } else {
        localStorage.removeItem("auth_token");
        setUser(null);
        setProfile(null);
        setRole("employee");
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchUserAndProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      setUser(data.user);
      setProfile(data.profile);
      setRole(data.user.role as AppRole);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (registrationData: { email: string; password?: string; fullName: string; department: string }) => {
    setLoading(true);
    try {
      const data = await registerApi({ ...registrationData, role: "employee" });
      setUser(data.user);
      setProfile(data.profile);
      setRole("employee");
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setProfile(null);
    setRole("employee");
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

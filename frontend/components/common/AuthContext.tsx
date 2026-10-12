"use client";

// 로그인한 회원 정보를 모든 화면(소비자 + 관리자)에서 함께 쓰기 위한 Context

import { createContext, useContext, useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { User, UserRole } from "@/types/user";

interface AuthContextValue {
  user: User | null; // 로그인하지 않았으면 null
  loading: boolean; // 처음에 로그인 정보를 확인하는 중인지
  login: (role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // 내 정보를 수정한 뒤 최신 정보로 다시 불러온다
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 처음 화면이 열릴 때 이미 로그인되어 있는지 확인한다
  useEffect(() => {
    api.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  async function login(role: UserRole) {
    const loggedInUser = await api.login(role);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  async function refreshUser() {
    const currentUser = await api.getCurrentUser();
    // 같은 객체를 돌려받아도 화면이 다시 그려지도록 복사해서 넣는다
    setUser(currentUser ? { ...currentUser } : null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 화면에서는 const { user } = useAuth(); 처럼 꺼내 쓴다
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}

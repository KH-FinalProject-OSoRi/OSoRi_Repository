import { createContext, useContext, useMemo, useState } from "react";
import { authApi } from "../api/authApi"; // [CHANGED] 로그아웃 API 호출하려고 추가

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!token;

  const login = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = async () => {
    // 서버 메시지 받고 띄우기 + 실패해도 로컬 로그아웃은 무조건 처리
    try {
      const data = await authApi.logout(); // 서버가 "로그아웃 되었습니다." 문자열을 내려줌

      // apiFetch는 content-type이 json이면 json, 아니면 text로 파싱함
     
      const message =
        typeof data === "string" && data.trim()
          ? data
          : data?.message || "로그아웃 되었습니다.";

      alert(message);
    } catch (error) {
      alert("로그아웃 처리 중 오류가 발생했음 (그래도 로그아웃 처리함)");
    } finally {
      // 여기서 로그아웃 완료(토큰/유저 제거)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken("");
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated, login, logout, setUser }),
    [token, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


// import { createContext, useContext, useMemo, useState } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(() => localStorage.getItem("token") || "");
//   const [user, setUser] = useState(() => {
//     const raw = localStorage.getItem("user");
//     try {
//       return raw ? JSON.parse(raw) : null;
//     } catch {
//       return null;
//     }
//   });

//   const isAuthenticated = !!token;

//   const login = ({ token: nextToken, user: nextUser }) => {
//     localStorage.setItem("token", nextToken);
//     localStorage.setItem("user", JSON.stringify(nextUser));
//     setToken(nextToken);
//     setUser(nextUser);
//   };

//   /*
//   const logout = async () => {
//     try {
//       // [CHANGED] 서버에 로그아웃 요청해서 메시지 받기
//       const res = await authApi.logout();

//       // [CHANGED] 서버가 주는 메시지 띄우기
//       alert(res.data); // "로그아웃 되었습니다."
//     } catch (error) {
//       // [CHANGED] 서버 호출 실패해도 프론트 로그아웃은 진행시키는 게 보통 UX 좋음
//       alert("로그아웃 처리 중 오류가 발생했음 (토큰은 삭제함)");
//     } finally {
//       // [CHANGED] 토큰/상태 제거 (진짜 로그아웃 핵심)
//       localStorage.removeItem("token");
//       setUser(null);
//     }
//   };
//   */

  
//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setToken("");
//     setUser(null);
//   };
  

//   const value = useMemo(
//     () => ({ token, user, isAuthenticated, login, logout, setUser }),
//     [token, user, isAuthenticated]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;


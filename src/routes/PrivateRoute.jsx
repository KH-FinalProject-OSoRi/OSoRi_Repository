import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  // ============================================================
  // [CHANGED]
  // - 로그인 안했으면 /login
  // - 로그인 했는데 status === 'H' 이면 /mypage/profileSettings 로 강제 이동
  //   (새로고침/직접 URL 입력/뒤로가기도 다 막기 위해서 여기서 가드함)
  // ============================================================
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();



  if (!isAuthenticated || !user || user.status === "N") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const isDormant = user?.status === "H";
  const isInProfileSettings = location.pathname === "/mypage/profileSettings";

  if (isDormant && !isInProfileSettings) {
    return <Navigate to="/mypage/profileSettings" replace />;
  }

  return children;
}
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {

  const {isAuthenticated, user} = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user || user.status === "N") {
    alert("로그인 후 이용 가능한 서비스입니다.");
    return <Navigate to="/" state={{ from: location }} replace />
  }  

  //탈퇴한 회원은 탈퇴 이후에 탈퇴한 회원이라고 한번 알려줍니다. 그리고 토큰이 사라지기 때문에 alert 메시지를 분리하지 않았습니다. 

  const isDormant = user?.status === "H";
  const isInProfileSettings = location.pathname === "/mypage/profileSettings";

  if (isDormant && !isInProfileSettings) {
    return <Navigate to="/mypage/profileSettings" replace />;
  }
  
  return children;
}
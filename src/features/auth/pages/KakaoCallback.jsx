import { useEffect, useRef } from "react"; // useRef 추가
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../api/http"; 
import { useAuth } from "../../../context/AuthContext"; 

export default function KakaoCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasCalled = useRef(false); // 실행 여부 체크용

 useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    
    // 코드가 있고, 아직 API를 호출하지 않았을 때만 실행
    if (code && !hasCalled.current) {
      hasCalled.current = true; // 실행됨으로 표시

      apiFetch(`/user/kakao/callback?code=${code}`)
        .then((res) => {
          if (res.isNewMember) {
            navigate("/social-register", { 
              state: { kakaoEmail: res.email, kakaoNickname: res.nickName, providerUserId: res.providerUserId } 
            });
          } else {
            const status = res?.user?.status;

            if(status==="H")  {
              alert(res.message);
            } else if(status==="N"){
              alert(res.message);
              <Link to="/login"></Link> // 탈퇴한 회원이면 강제로 로그인 화면으로 이동 
            }
            
            login(res); // 일반 로그인 마냥 감
            navigate("/mypage", { replace: true });
          }
        })
        .catch((err) => {
          console.error(err);
          navigate("/login");
        });
    }
  }, [login, navigate]);

  return <div>카카오 로그인 처리 중...</div>;
}

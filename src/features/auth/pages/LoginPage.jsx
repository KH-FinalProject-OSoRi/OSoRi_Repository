import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";
import { authApi } from "../../../api/authApi";
import { useAuth } from "../../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    loginId: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    const fromRegisterLoginId = location.state?.loginId;
    const savedLoginId = localStorage.getItem("savedLoginId");

    if (fromRegisterLoginId) {
      setForm((p) => ({ ...p, loginId: fromRegisterLoginId }));
    } else if (savedLoginId) {
      setForm((p) => ({ ...p, loginId: savedLoginId, remember: true }));
    }
  }, [location.state]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const loginId = form.loginId.trim();
    const password = form.password;

    if (!loginId || !password) {
      alert("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      const res = await authApi.login(loginId, password);

      // ✅ 로그인 성공이면 token/user 저장부터 해야 PrivateRoute 통과가 안정적임
      login(res);

      if (form.remember) localStorage.setItem("savedLoginId", loginId);
      else localStorage.removeItem("savedLoginId");

      // =======================================================
      // [CHANGED] ✅ status === "H" 이면:
      // 1) 서버가 내려준 message(alert) 띄움
      // 2) 프로필 설정으로 강제 이동
      // ============================================================
      const status = res?.user?.status;
      if (status === "H") {
        if (res?.message) alert(res.message);
        navigate("/mypage/profileSettings", { replace: true });
        return;
      }

      // [기존] 정상(Y) 회원이면 마이페이지로
      navigate("/mypage", { replace: true });
    } catch (e2) {
      const msg = e2?.data?.message || "로그인 실패";
      alert(msg);
    }
  };

  return (
    <div className={styles.wrap}>
      <Link to="/" className={styles.title}>
        OSORI
      </Link>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <div className={styles.label}>아이디</div>
          <input
            className={styles.input}
            name="loginId"
            value={form.loginId}
            onChange={onChange}
            placeholder="ID"
            autoComplete="username"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>비밀번호</div>
          <input
            className={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="비밀번호"
            autoComplete="current-password"
          />
        </div>

        <button className={styles.loginBtn} type="submit">
          로그인
        </button>
      </form>

      <div className={styles.simpleArea}>
        <div className={styles.simpleTitle}>간편 로그인</div>

        <div className={styles.socialRow}>
          <button
            className={`${styles.socialBtn} ${styles.kakao}`}
            type="button"
            aria-label="카카오 로그인"
          >
            <KakaoIcon />
          </button>
          <button
            className={`${styles.socialBtn} ${styles.naver}`}
            type="button"
            aria-label="네이버 로그인"
          >
            <NaverIcon />
          </button>
        </div>
      </div>

      {/* [BEFORE] 하단 버튼 2개(아이디/비밀번호 찾기 미구현) */}
      {/*
            <div className={styles.bottomRow}>
              <button className={styles.subBtn} type="button">
                아이디/비밀번호 찾기
              </button>
              <button className={styles.subBtn} type="button" onClick={() => navigate("/register")}>
                회원가입
              </button>
            </div>
      */}

      {/* [CHANGED] 하단 버튼 3개: 아이디 찾기 / 비밀번호 찾기 / 회원가입 */}
      <div className={styles.bottomRow}>
        <button className={styles.subBtn} type="button" onClick={() => navigate("/find-id")}>
          아이디 찾기
        </button>
        <button
          className={styles.subBtn}
          type="button"
          onClick={() => navigate("/find-password")}
        >
          비밀번호 찾기
        </button>
        <button className={styles.subBtn} type="button" onClick={() => navigate("/register")}>
          회원가입
        </button>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.58 2 11c0 2.84 1.86 5.34 4.65 6.77-.2.72-.73 2.6-.84 3.02-.1.38.14.38.3.27.13-.09 2.1-1.43 2.95-2.02.62.09 1.26.14 1.94.14 5.523 0 10-3.58 10-8S17.523 3 12 3z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h4.2l5.8 8V7H21v10h-4.2L11 9v8H7V7z" />
    </svg>
  );
}

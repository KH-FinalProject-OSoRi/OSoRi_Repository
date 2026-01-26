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

  // 회원가입 후 navigate("/login", { state: { loginId } }) 해둔거 받아서 자동 채우기
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
      login(res);

      if (form.remember) localStorage.setItem("savedLoginId", loginId);
      else localStorage.removeItem("savedLoginId");

      navigate("/mypage", { replace: true });
    } catch (e2) {
      const msg = e2?.data?.message || "로그인 실패";
      alert(msg);
    }
  };

  return (
    <div className={styles.wrap}>
      <Link to="/" className={styles.title}>
        OSoRi
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

        {/*
        <label className={styles.remember}>
          <input
            type="checkbox"
            name="remember"
            checked={form.remember}
            onChange={onChange}
          />
          <span>아이디저장</span>
        </label>
        */}

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

      <div className={styles.bottomRow}>
        <button className={styles.subBtn} type="button">
          아이디/비밀번호 찾기
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
      <path d="M12 3C6.477 3 2 6.58 2 11c0 2.84 1.86 5.34 4.65 6.77-.2.72-.73 2.6-.84 3.02-.13.5.18.5.38.36.16-.1 2.56-1.73 3.6-2.44.73.1 1.48.15 2.21.15 5.523 0 10-3.58 10-8S17.523 3 12 3z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 12.6 9.8 5H5v14h4.7V11.4L14.2 19H19V5h-4.5v7.6z" />
    </svg>
  );
}



// import { useEffect, useState } from "react";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import styles from "./LoginPage.module.css";
// import { authApi } from "../../../api/authApi";
// import { useAuth } from "../../../context/AuthContext";

// export default function LoginPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { login } = useAuth();

//   const [form, setForm] = useState({
//     loginId: "",
//     password: "",
//     remember: false,
//   });

//   // 회원가입 후 navigate("/login", { state: { loginId } }) 해둔거 받아서 자동 채우기
//   useEffect(() => {
//     const fromRegisterLoginId = location.state?.loginId;
//     const savedLoginId = localStorage.getItem("savedLoginId");

//     if (fromRegisterLoginId) {
//       setForm((p) => ({ ...p, loginId: fromRegisterLoginId }));
//     } else if (savedLoginId) {
//       setForm((p) => ({ ...p, loginId: savedLoginId, remember: true }));
//     }
//   }, [location.state]);

//   const onChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();

//     const loginId = form.loginId.trim();
//     const password = form.password;

//     if (!loginId || !password) {
//       alert("아이디와 비밀번호를 입력하세요.");
//       return;
//     }

//     try {
//       const res = await authApi.login(loginId, password);
//       // res가 { token, user } 형태라고 가정 (AuthContext.login 구조가 이 형태)
//       login(res);

//       if (form.remember) localStorage.setItem("savedLoginId", loginId);
//       else localStorage.removeItem("savedLoginId");

//       navigate("/mypage", { replace: true });
//     } catch (e2) {
//       const msg = e2?.data?.message || "로그인 실패";
//       alert(msg);
//     }
//   };

//   return (
//     <div className={styles.wrap}>
//       <Link to="/" className={styles.title}>
//         OSoRi
//       </Link>

//       <form className={styles.form} onSubmit={onSubmit}>
//         <div className={styles.field}>
//           <div className={styles.label}>아이디</div>
//           <input
//             className={styles.input}
//             name="loginId"
//             value={form.loginId}
//             onChange={onChange}
//             placeholder="ID"
//             autoComplete="username"
//           />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.label}>비밀번호</div>
//           <input
//             className={styles.input}
//             type="password"
//             name="password"
//             value={form.password}
//             onChange={onChange}
//             placeholder="비밀번호"
//             autoComplete="current-password"
//           />
//         </div>


//         {/* 
//         <label className={styles.remember}>
//           <input
//             type="checkbox"
//             name="remember"
//             checked={form.remember}
//             onChange={onChange}
//           />
//           <span>아이디저장</span>
//         </label>
//           */}
          
//         <button className={styles.loginBtn} type="submit">
//           로그인
//         </button>
      
//       </form>

//       <div className={styles.simpleArea}>
//         <div className={styles.simpleTitle}>간편 로그인</div>

//         <div className={styles.socialRow}>
//           <button className={`${styles.socialBtn} ${styles.kakao}`} type="button" aria-label="카카오 로그인">
//             <KakaoIcon />
//           </button>
//           <button className={`${styles.socialBtn} ${styles.naver}`} type="button" aria-label="네이버 로그인">
//             <NaverIcon />
//           </button>
//         </div>
//       </div>

//       <div className={styles.bottomRow}>
//         <button className={styles.subBtn} type="button">아이디/비밀번호 찾기</button>
//         <button className={styles.subBtn} type="button" onClick={() => navigate("/register")}>
//           회원가입
//         </button>
//       </div>
//     </div>
//   );
// }

// function KakaoIcon() {
//   return (
//     <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
//       <path d="M12 3C6.477 3 2 6.58 2 11c0 2.84 1.86 5.34 4.65 6.77-.2.72-.73 2.6-.84 3.02-.13.5.18.5.38.36.16-.1 2.56-1.73 3.6-2.44.73.1 1.48.15 2.21.15 5.523 0 10-3.58 10-8S17.523 3 12 3z"/>
//     </svg>
//   );
// }

// function NaverIcon() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
//       <path d="M14.5 12.6 9.8 5H5v14h4.7V11.4L14.2 19H19V5h-4.5v7.6z"/>
//     </svg>
//   );
// }


// import { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import styles from "./LoginPage.module.css";
// import { authApi } from "../../../api/authApi";
// import { useAuth } from "../../../context/AuthContext";

// export default function LoginPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { login } = useAuth();

//   const [form, setForm] = useState({ id: "", password: "", remember: false });
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     const remembered = localStorage.getItem("rememberId") || "";
//     const rememberedOn = !!remembered;
//     const fromRegisterId = location.state?.loginId || "";

//     setForm((p) => ({
//       ...p,
//       id: fromRegisterId || remembered,
//       remember: fromRegisterId ? true : rememberedOn,
//     }));
//   }, [location.state]);

//   const onChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
//     setError("");
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     const loginId = form.id.trim();
//     const password = form.password;

//     if (!loginId || !password) {
//       setError("아이디/비번 입력해야 함");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const res = await authApi.login(loginId, password);

//       if (form.remember) localStorage.setItem("rememberId", loginId);
//       else localStorage.removeItem("rememberId");

//       login(res);

//       navigate("/mypage", { replace: true });
//     } catch (e) {
//       const msg = e?.data?.message || "로그인 실패";
//       setError(msg);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className={styles.wrap}>
//       <h1 className={styles.title}>OSoRi</h1>

//       <form className={styles.form} onSubmit={onSubmit}>
//         <div className={styles.field}>
//           <div className={styles.label}>아이디</div>
//           <input
//             className={styles.input}
//             name="id"
//             value={form.id}
//             onChange={onChange}
//             placeholder="ID"
//             autoComplete="username"
//           />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.label}>비밀번호</div>
//           <input
//             className={styles.input}
//             type="password"
//             name="password"
//             value={form.password}
//             onChange={onChange}
//             placeholder="비밀번호"
//             autoComplete="current-password"
//           />
//         </div>

//         <label className={styles.remember}>
//           <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
//           <span>아이디저장</span>
//         </label>

//         {error && <div style={{ color: "#d1242f", fontWeight: 800, fontSize: 13 }}>{error}</div>}

//         <button className={styles.loginBtn} type="submit" disabled={isLoading}>
//           {isLoading ? "로그인 중..." : "로그인"}
//         </button>
//       </form>

//       <div className={styles.simpleArea}>
//         <div className={styles.simpleTitle}>간편 로그인</div>

//         <div className={styles.socialRow}>
//           <button className={`${styles.socialBtn} ${styles.kakao}`} type="button" aria-label="카카오 로그인">
//             <KakaoIcon />
//           </button>
//           <button className={`${styles.socialBtn} ${styles.naver}`} type="button" aria-label="네이버 로그인">
//             <NaverIcon />
//           </button>
//         </div>
//       </div>

//       <div className={styles.bottomRow}>
//         <button className={styles.subBtn} type="button">
//           아이디/비밀번호 찾기
//         </button>
//         <button className={styles.subBtn} type="button" onClick={() => navigate("/register")}>
//           회원가입
//         </button>
//       </div>
//     </div>
//   );
// }

// function KakaoIcon() {
//   return (
//     <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
//       <path d="M12 3C6.477 3 2 6.58 2 11c0 2.84 1.86 5.34 4.65 6.77-.2.72-.73 2.6-.84 3.02-.13.5.18.5.38.36.16-.1 2.56-1.73 3.6-2.44.73.1 1.48.15 2.21.15 5.523 0 10-3.58 10-8S17.523 3 12 3z" />
//     </svg>
//   );
// }

// function NaverIcon() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
//       <path d="M14.5 12.6 9.8 5H5v14h4.7V11.4L14.2 19H19V5h-4.5v7.6z" />
//     </svg>
//   );
// }


// import { useState } from "react";
// import styles from "./LoginPage.module.css";

// export default function LoginPage() {
//   const [form, setForm] = useState({ id: "", password: "", remember: false });

//   const onChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
//   };

//   const onSubmit = (e) => {
//     e.preventDefault();
//     alert("로그인 API 연결하면 됨");
//   };

//   return (
//     <div className={styles.wrap}>
//       <h1 className={styles.title}>OSoRi</h1>

//       <form className={styles.form} onSubmit={onSubmit}>
//         <div className={styles.field}>
//           <div className={styles.label}>아이디</div>
//           <input
//             className={styles.input}
//             name="id"
//             value={form.id}
//             onChange={onChange}
//             placeholder="ID"
//           />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.label}>비밀번호</div>
//           <input
//             className={styles.input}
//             type="password"
//             name="password"
//             value={form.password}
//             onChange={onChange}
//             placeholder="비밀번호"
//           />
//         </div>

//         <label className={styles.remember}>
//           <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
//           <span>아이디저장</span>
//         </label>

//         <button className={styles.loginBtn} type="submit">
//           로그인
//         </button>
//       </form>

//       <div className={styles.simpleArea}>
//         <div className={styles.simpleTitle}>간편 로그인</div>

//         <div className={styles.socialRow}>
//           <button className={`${styles.socialBtn} ${styles.kakao}`} type="button" aria-label="카카오 로그인">
//             <KakaoIcon />
//           </button>
//           <button className={`${styles.socialBtn} ${styles.naver}`} type="button" aria-label="네이버 로그인">
//             <NaverIcon />
//           </button>
          
//         </div>
//       </div>

//       <div className={styles.bottomRow}>
//         <button className={styles.subBtn} type="button">아이디/비밀번호 찾기</button>
//         <button className={styles.subBtn} type="button">회원가입</button>
//       </div>
//     </div>
//   );
// }

// function KakaoIcon() {
//   return (
//     <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
//       <path d="M12 3C6.477 3 2 6.58 2 11c0 2.84 1.86 5.34 4.65 6.77-.2.72-.73 2.6-.84 3.02-.13.5.18.5.38.36.16-.1 2.56-1.73 3.6-2.44.73.1 1.48.15 2.21.15 5.523 0 10-3.58 10-8S17.523 3 12 3z"/>
//     </svg>
//   );
// }

// function NaverIcon() {
//   return (
//     <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
//       <path d="M14.5 12.6 9.8 5H5v14h4.7V11.4L14.2 19H19V5h-4.5v7.6z"/>
//     </svg>
//   );
// }


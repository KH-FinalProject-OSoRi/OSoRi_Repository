import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./RegisterPage.module.css";
import { authApi } from "../../../api/authApi";

export default function RegisterPage() {
  const navigate = useNavigate();

  // ====== 검증 규칙 (blur 기반) ======
  const RULES = {
    loginId: {
      // 8~16자, 영문/숫자만
      re: /^[A-Za-z0-9]{8,16}$/,
      msg: "영어와 숫자로 이루어진 8~16자로 입력하세요.",
    },
    userName: {
      // 3~5자, 한글만
      re: /^[가-힣]{3,5}$/,
      msg: "한글로만 이루어진 3~5자를 입력하세요.",
    },
    nickName: {
      // 3~5자, 한글만
      re: /^[가-힣]{3,5}$/,
      msg: "한글로만 이루어진 3~5자를 입력하세요.",
    },
    email: {
      // 이메일 형식(@ 포함) + 전체 길이 10~20자
      re: /^(?=.{10,20}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      msg: "이메일 형식으로 10~20자로 입력하세요.",
    },
  };

  const [form, setForm] = useState({
    loginId: "",
    password: "",
    userName: "",
    nickName: "",
    email: "",
  });

  const [fieldError, setFieldError] = useState({
    loginId: "",
    password: "",
    userName: "",
    nickName: "",
    email: "",
  });

  const [touched, setTouched] = useState({
    loginId: false,
    password: false,
    userName: false,
    nickName: false,
    email: false,
  });

  const [idCheck, setIdCheck] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name, rawValue) => {
    const value = (rawValue ?? "").trim();

    // 비밀번호는 "필수"만 체크
    if (name === "password") return value ? "" : "비밀번호를 입력하세요.";

    const rule = RULES[name];
    if (!rule) return value ? "" : "";

    // 빈 값도 불만족으로 처리(요청한 문구 뜨게)
    if (!value) return rule.msg;

    return rule.re.test(value) ? "" : rule.msg;
  };

  const onChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => ({ ...p, [name]: value }));
    setError("");

    if (name === "loginId") setIdCheck(null);

    // blur 된 필드는 입력 중에도 메시지 갱신
    if (touched[name]) {
      setFieldError((p) => ({ ...p, [name]: validateField(name, value) }));
    }
  };

  const onBlur = (e) => {
    const { name, value } = e.target;

    setTouched((p) => ({ ...p, [name]: true }));
    setFieldError((p) => ({ ...p, [name]: validateField(name, value) }));

    if (name === "loginId") setIdCheck(null);
  };

  const canSubmit = useMemo(() => {
    return (
      form.loginId.trim() &&
      form.password.trim() &&
      form.userName.trim() &&
      form.nickName.trim() &&
      form.email.trim()
    );
  }, [form]);

  const handleCheckId = async () => {
    setError("");
    setIdCheck(null);

    const loginId = form.loginId.trim();
    if (!loginId) {
      setError("아이디를 입력하세요.");
      return;
    }

    // 아이디 규칙 먼저 통과해야 중복체크
    const loginIdMsg = validateField("loginId", loginId);
    setTouched((p) => ({ ...p, loginId: true }));
    setFieldError((p) => ({ ...p, loginId: loginIdMsg }));
    if (loginIdMsg) return;

    try {
      const res = await authApi.checkId(loginId);
      setIdCheck({
        available: !!res.available,
        msg: res.available ? "사용 가능한 아이디입니다." : "이미 사용중인 아이디입니다.",
      });
    } catch (e) {
      setError("아이디 중복체크 실패했습니다.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // submit 시 전체 검증(blur 안 해도 막기)
    const nextTouched = {
      loginId: true,
      password: true,
      userName: true,
      nickName: true,
      email: true,
    };

    const nextFieldError = {
      loginId: validateField("loginId", form.loginId),
      password: validateField("password", form.password),
      userName: validateField("userName", form.userName),
      nickName: validateField("nickName", form.nickName),
      email: validateField("email", form.email),
    };

    setTouched(nextTouched);
    setFieldError(nextFieldError);

    const hasError = Object.values(nextFieldError).some(Boolean);
    if (hasError) {
      setError("입력값을 확인하세요.");
      return;
    }

    if (!canSubmit) {
      setError("모든 항목에 입력값을 입력해 주세요.");
      return;
    }

    if (idCheck && idCheck.available === false) {
      setError("이미 사용중인 아이디입니다.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        loginId: form.loginId.trim(),
        password: form.password,
        userName: form.userName.trim(),
        nickName: form.nickName.trim(),
        email: form.email.trim(),
      });

      alert("회원가입에 성공했습니다.");
      navigate("/login", { replace: true, state: { loginId: form.loginId.trim() } });
    } catch (e) {
      const msg = e?.data?.message || "회원가입에 실패 했습니다.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>회원가입</h1>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <div className={styles.labelRow}>
            <div className={styles.label}>아이디</div>
            <button className={styles.checkBtn} type="button" onClick={handleCheckId}>
              중복체크
            </button>
          </div>

          <input
            className={styles.input}
            name="loginId"
            value={form.loginId}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="영어/숫자 8~16자로 입력해 주세요."
            autoComplete="username"
          />

          {touched.loginId && fieldError.loginId ? (
            <div className={`${styles.hint} ${styles.bad}`}>{fieldError.loginId}</div>
          ) : (
            idCheck && (
              <div className={`${styles.hint} ${idCheck.available ? styles.ok : styles.bad}`}>
                {idCheck.msg}
              </div>
            )
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>비밀번호</div>
          <input
            className={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="비밀번호를 입력해 주세요."
            autoComplete="new-password"
          />
          {touched.password && fieldError.password && (
            <div className={`${styles.hint} ${styles.bad}`}>{fieldError.password}</div>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>이름</div>
          <input
            className={styles.input}
            name="userName"
            value={form.userName}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="한글 3~5자로 입력해 주세요."
          />
          {touched.userName && fieldError.userName && (
            <div className={`${styles.hint} ${styles.bad}`}>{fieldError.userName}</div>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>닉네임</div>
          <input
            className={styles.input}
            name="nickName"
            value={form.nickName}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="한글 3~5자로 입력해 주세요."
          />
          {touched.nickName && fieldError.nickName && (
            <div className={`${styles.hint} ${styles.bad}`}>{fieldError.nickName}</div>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>이메일</div>
          <input
            className={styles.input}
            type="text"
            name="email"
            value={form.email}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="이메일 형식(@ 포함)으로 10~20자로 입력해 주세요."
            autoComplete="email"
          />
          {touched.email && fieldError.email && (
            <div className={`${styles.hint} ${styles.bad}`}>{fieldError.email}</div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submitBtn} type="submit" disabled={isLoading}>
          {isLoading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <div className={styles.bottomRow}>
        <button className={styles.subBtn} type="button" onClick={() => navigate("/login")}>
          로그인으로
        </button>
      </div>
    </div>
  );
}


// import { useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import styles from "./RegisterPage.module.css";
// import { authApi } from "../../../api/authApi";

// export default function RegisterPage() {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     loginId: "",
//     password: "",
//     userName: "",
//     nickName: "",
//     email: "",
//   });

//   const [idCheck, setIdCheck] = useState(null);
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const onChange = (e) => {
//     const { name, value } = e.target;
//     setForm((p) => ({ ...p, [name]: value }));
//     setError("");
//     if (name === "loginId") setIdCheck(null);
//   };

//   const canSubmit = useMemo(() => {
//     return (
//       form.loginId.trim() &&
//       form.password.trim() &&
//       form.userName.trim() &&
//       form.nickName.trim() &&
//       form.email.trim()
//     );
//   }, [form]);

//   const handleCheckId = async () => {
//     setError("");
//     setIdCheck(null);

//     const loginId = form.loginId.trim();
//     if (!loginId) {
//       setError("아이디를 입력하세요.");
//       return;
//     }

//     try {
//       const res = await authApi.checkId(loginId);
//       setIdCheck({
//         available: !!res.available,
//         msg: res.available ? "사용 가능한 아이디입니다." : "이미 사용중인 아이디입니다.",
//       });
//     } catch (e) {
//       setError("아이디 중복체크 실패했습니다.");
//     }
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!canSubmit) {
//       setError("모든 항목에 입력값을 넣어야 합니다.");
//       return;
//     }

//     if (idCheck && idCheck.available === false) {
//       setError("이미 사용중인 아이디입니다.");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await authApi.register({
//         loginId: form.loginId.trim(),
//         password: form.password,
//         userName: form.userName.trim(),
//         nickName: form.nickName.trim(),
//         email: form.email.trim(),
//       });

//       alert("회원가입에 성공했습니다.");
//       navigate("/login", { replace: true, state: { loginId: form.loginId.trim() } });
//     } catch (e) {
//       const msg = e?.data?.message || "회원가입에 실패 했습니다.";
//       setError(msg);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className={styles.wrap}>
//       <h1 className={styles.title}>회원가입</h1>

//       <form className={styles.form} onSubmit={onSubmit}>
//         <div className={styles.field}>
//           <div className={styles.labelRow}>
//             <div className={styles.label}>아이디</div>
//             <button className={styles.checkBtn} type="button" onClick={handleCheckId}>
//               중복체크
//             </button>
//           </div>
//           <input
//             className={styles.input}
//             name="loginId"
//             value={form.loginId}
//             onChange={onChange}
//             placeholder="ID"
//             autoComplete="username"
//           />
//           {idCheck && (
//             <div className={`${styles.hint} ${idCheck.available ? styles.ok : styles.bad}`}>
//               {idCheck.msg}
//             </div>
//           )}
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
//             autoComplete="new-password"
//           />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.label}>이름</div>
//           <input className={styles.input} name="userName" value={form.userName} onChange={onChange} placeholder="이름" />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.label}>닉네임</div>
//           <input className={styles.input} name="nickName" value={form.nickName} onChange={onChange} placeholder="닉네임" />
//         </div>

//         <div className={styles.field}>
//           <div className={styles.label}>이메일</div>
//           <input
//             className={styles.input}
//             type="email"
//             name="email"
//             value={form.email}
//             onChange={onChange}
//             placeholder="email@example.com"
//             autoComplete="email"
//           />
//         </div>

//         {error && <div className={styles.error}>{error}</div>}

//         <button className={styles.submitBtn} type="submit" disabled={isLoading}>
//           {isLoading ? "가입 중..." : "회원가입"}
//         </button>
//       </form>

//       <div className={styles.bottomRow}>
//         <button className={styles.subBtn} type="button" onClick={() => navigate("/login")}>
//           로그인으로
//         </button>
//       </div>
//     </div>
//   );
// }

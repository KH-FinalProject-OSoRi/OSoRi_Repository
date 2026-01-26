import { apiFetch } from "./http";

export const authApi = {
  login: (loginId, password) =>
    apiFetch("/user/login", { method: "POST", body: { loginId, password }, auth: false }),

  register: ({ loginId, password, userName, nickName, email }) =>
    apiFetch("/user/register", {
      method: "POST",
      body: { loginId, password, userName, nickName, email },
      auth: false,
    }),

  // API(/user/checkid?loginId=)
  checkId: (loginId) =>
    apiFetch(`/user/checkId?loginId=${encodeURIComponent(loginId)}`, { auth: false }),

  //닉네임 중복 체크
  checkNickName: (nickName) =>
    apiFetch(`/user/checkNickName?nickName=${encodeURIComponent(nickName)}`, { auth: false }),

  //이메일 중복 체크
  checkEmail: (email) =>
    apiFetch(`/user/checkEmail?email=${encodeURIComponent(email)}`, { auth: false }),

   logout: () => apiFetch("/user/logout", { method: "POST" }), // 로그아웃
};



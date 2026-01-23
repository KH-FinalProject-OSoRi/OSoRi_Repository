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

  checkId: (loginId) =>
    apiFetch(`/user/check-id?loginId=${encodeURIComponent(loginId)}`, { auth: false }),

   logout: () => apiFetch("/user/logout", { method: "POST" }), // 로그아웃
};


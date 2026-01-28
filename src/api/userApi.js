import { apiFetch } from "./http";

// 프론트는 여기만 고치면 ProfileSettings 화면 로직은 그대로 유지됨.

// =============================
// [BEFORE] 중복 체크 API가 없던 버전
// export const userApi = {
//   updateMe: (payload) => apiFetch("/user/me", { method: "PATCH", body: payload }),
//   changePassword: ({ currentPassword, newPassword }) =>
//     apiFetch("/user/password", { method: "PATCH", body: { currentPassword, newPassword } }),
//   withdraw: ({ password }) =>
//     apiFetch("/user/withdraw", { method: "POST", body: { password } }),
// };
// =============================

export const userApi = {
  // =============================
  // [ADDED] 중복 체크 (회원가입 때 쓰던 방식 그대로 활용)
  // - 백엔드에 이미 존재하는 엔드포인트 기준
  //   GET /osori/user/checkNickName?nickName=xxx  -> { count: 0|1|... }
  //   GET /osori/user/checkEmail?email=xxx        -> { count: 0|1|... }
  // =============================

  checkNickName: (nickName) =>
    apiFetch(`/user/checkNickName?nickName=${encodeURIComponent(nickName)}`),

  checkEmail: (email) => apiFetch(`/user/checkEmail?email=${encodeURIComponent(email)}`),

  // 내 정보 수정 (닉네임/이름/이메일 등)
  updateMe: (payload) => apiFetch("/user/update", { method: "PATCH", body: payload }),

  // 비밀번호 변경
  changePassword: ({ currentPassword, newPassword }) =>
    apiFetch("/user/updatePassword", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  // 회원탈퇴
  // 예시: POST /osori/user/delete 
  // (DELETE + body는 서버에서 막는 경우가 많아서 POST로 잡아둠)
  withdraw: ({ password }) =>
    apiFetch("/user/delete", {
      method: "DELETE",
      body: { password },
    }),
};



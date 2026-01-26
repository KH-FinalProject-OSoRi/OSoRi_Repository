
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { userApi } from "../../../api/userApi";
import "./MyPage.css";
import "./ProfileSettings.css";

function ProfileSettings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  // 서버(저장된) 기준 초기값
  const initial = useMemo(() => {
    const displayName = user?.nickName || user?.nickname || user?.loginId || "회원";
    const name = user?.userName || user?.name || "";
    const email = user?.email || "";
    return { displayName, name, email };
  }, [user]);

  // 입력(draft) 상태: 저장 버튼 누르기 전까지는 서버/상단표시와 분리
  const [nickName, setNickName] = useState(initial.displayName);
  const [userName, setUserName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);

  // 서버 initial이 바뀌면(저장 성공 후 setUser 등) 입력값도 동기화
  useEffect(() => {
    setNickName(initial.displayName);
    setUserName(initial.name);
    setEmail(initial.email);
    lastCheckedRef.current = { nickName: "", email: "" };
  }, [initial.displayName, initial.name, initial.email]);

  const [fieldErrors, setFieldErrors] = useState({
    nickName: "",
    email: "",
    userName: "",
  });

  // blur 중복체크 최적화: 같은 값으로 재-blur 시 서버호출 스킵
  const lastCheckedRef = useRef({ nickName: "", email: "" });

  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  //원래 회원탈퇴 디자인(카드 + 모달)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawConfirmText, setWithdrawConfirmText] = useState("");
  const [withdrawChecked, setWithdrawChecked] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const hasProfileChanges = nickName !== initial.displayName || userName !== initial.name;
  const hasEmailChanges = email !== initial.email;

  // 주의: 현재 백엔드 /user/update 는 @RequestBody(User)만 받음
  // FormData(이미지 업로드)는 백엔드 multipart 처리 없으면 400/415 등으로 터질 수 있다.
  const hasProfileImageChanges = !!uploadFile;

  const hasPasswordChanges =
    isPasswordEditing && (currentPassword || newPassword || newPasswordConfirm);

  const canSave =
    hasProfileChanges || hasEmailChanges || hasProfileImageChanges || hasPasswordChanges;

  const hasFieldErrors = Boolean(fieldErrors.nickName || fieldErrors.email || fieldErrors.userName);
  const canSubmit = canSave && !isSaving && !hasFieldErrors;

  const validate = () => {
    if (!nickName.trim()) return "닉네임은 비울 수 없습니다/";
    if (!email.trim()) return "이메일은 비울 수 없습니다.";
    if (!email.includes("@")) return "이메일 형식이 아닙니다.";

    // 이름은 선택일 수 있으니: 입력했으면 최소 규칙만
    const trimmedUserName = (userName || "").trim();
    if (trimmedUserName && trimmedUserName.length < 2) return "이름은 2글자 이상 입력해주세요.";

    if (isPasswordEditing) {
      if (!currentPassword.trim()) return "현재 비밀번호를 입력해야 함";
      if (!newPassword.trim()) return "새 비밀번호를 입력해야 함";
      if (newPassword.length < 8) return "새 비밀번호는 8자 이상 권장함";
      if (newPassword !== newPasswordConfirm) return "새 비밀번호 확인이 일치하지 않음";
    }
    return "";
  };

  // blur 시 닉네임 중복체크: 변경된 경우만 + 같은 값 재-blur 스킵
  const checkNickNameDuplicate = async () => {
    const v = (nickName || "").trim();
    if (!v) return;

    // 초기값(서버 저장값)과 같으면 체크 스킵
    if (v === (initial.displayName || "")) {
      setFieldErrors((prev) => ({ ...prev, nickName: "" }));
      return;
    }

    // 같은 값으로 또 blur되면 서버 호출 스킵
    if (v === (lastCheckedRef.current.nickName || "")) return;
    lastCheckedRef.current.nickName = v;

    try {
      const res = await userApi.checkNickName(v);
      const count = Number(res?.count ?? 0);
      setFieldErrors((prev) => ({
        ...prev,
        nickName: count > 0 ? "이미 등록된 닉네임입니다." : "",
      }));
    } catch {
      // 네트워크 오류 등은 UX상 조용히 처리(원하면 메시지 띄워도 됨)
    }
  };

  // blur 시 이메일 중복체크: 변경된 경우만 + 같은 값 재-blur 스킵
  const checkEmailDuplicate = async () => {
    const v = (email || "").trim().toLowerCase();
    if (!v) return;

    // 초기값(서버 저장값)과 같으면 체크 스킵
    if (v === (initial.email || "").trim().toLowerCase()) {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
      return;
    }

    // 같은 값으로 또 blur되면 서버 호출 스킵
    if (v === (lastCheckedRef.current.email || "")) return;
    lastCheckedRef.current.email = v;

    try {
      const res = await userApi.checkEmail(v);
      const count = Number(res?.count ?? 0);
      setFieldErrors((prev) => ({
        ...prev,
        email: count > 0 ? "이미 등록된 이메일입니다." : "",
      }));
    } catch {}
  };

  // 이름 blur 간단 검증(중복체크 API가 없다고 해서 프론트 최소검증만)
  const checkUserNameOnBlur = () => {
    const v = (userName || "").trim();
    const init = (initial.name || "").trim();

    // 비었으면(선택값) 에러 제거
    if (!v) {
      setFieldErrors((prev) => ({ ...prev, userName: "" }));
      return;
    }

    // 초기값으로 돌아온 경우 스킵
    if (v === init) {
      setFieldErrors((prev) => ({ ...prev, userName: "" }));
      return;
    }

    if (v.length < 2) {
      setFieldErrors((prev) => ({ ...prev, userName: "이름은 2글자 이상 입력해주세요." }));
      return;
    }

    setFieldErrors((prev) => ({ ...prev, userName: "" }));
  };

  const handleSelectProfileFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) {
      if (msg.includes("닉네임")) setFieldErrors((prev) => ({ ...prev, nickName: msg }));
      if (msg.includes("이메일")) setFieldErrors((prev) => ({ ...prev, email: msg }));
      if (msg.includes("이름")) setFieldErrors((prev) => ({ ...prev, userName: msg }));
      alert(msg);
      return;
    }

    if (hasFieldErrors) {
      alert("중복/형식 오류를 먼저 해결해야 함");
      return;
    }

    // =========================
    // [ADDED] loginId는 서버 update 쿼리 WHERE LOGIN_ID=#{loginId}에 필수
    // userId가 0으로 찍히는 건 "요청에 userId가 없어서 int 기본값 0"인 거라 정상이고
    // 여기서는 loginId만 확실히 보내면 됨
    // =========================
    const loginId = (user?.loginId || "").trim();
    if (!loginId) {
      alert("로그인 정보가 없습니다. 로그인을 다시 하셔야 합니다.");
      return;
    }

    // =========================
    // [CHANGED] 백엔드 updateUser가 고정 SET이라면
    // - nickName/email/userName을 "항상" 같이 보내는 게 안전함
    // - userName은 선택값이라 공백이면 null로 보냄(Oracle은 ''도 null 취급)
    // - email은 중복체크 로직이 lower()를 쓰는 편이라 소문자 저장으로 통일
    // =========================
    const mePayload = {
      loginId, // 로그인 아이디 갖고오기
      nickName: (nickName || "").trim(),
      userName: (userName || "").trim() || null,
      email: (email || "").trim().toLowerCase(),
      status: user?.status,
    };

    // =========================
    // [ADDED] 프로필 이미지 업로드는 현재 백엔드가 multipart를 안 받음
    // - 이미지까지 같이 저장하려면 백엔드에서 @RequestPart / MultipartFile 처리 필요
    // - 일단은 기존 로직 주석으로 남기고, 지금은 이미지 저장은 막는다
    // =========================
    if (uploadFile) {
      // 이미지 외에도 다른 변경사항이 있으면 그건 저장 진행하고, 이미지는 무시
      const onlyImageChange = !hasProfileChanges && !hasEmailChanges && !hasPasswordChanges;
      if (onlyImageChange) {
        alert("프로필 이미지 업로드는 백엔드 multipart 처리가 필요해서 아직 저장 불가함");
        return;
      }
      alert("프로필 이미지 업로드는 아직 서버 미지원이라 이번 저장에서는 반영 안됨");
    }

    setIsSaving(true);
    setSaveError("");

    try {
      let updatedUser = null;

      // =========================
      // [CHANGED] JSON만 PATCH (loginId 포함 + 전체 필드 전송)
      // =========================
      const res = await userApi.updateMe(mePayload);

      // ============================================================
      // [CHANGED] ✅ 서버 ResponseEntity의 message를 프론트에서 쓰기
      // - 원래 코드는 res.user만 쓰고, message는 버려져서
      //   아래 alert("저장 완료")만 뜨던 상황이었음
      // ============================================================
      const serverMessage = res?.message; // [CHANGED] 서버가 내려준 message

      updatedUser = res?.user || res;

      // 서버가 user를 제대로 안 내려주는 케이스 대비(안전장치)
      if (!updatedUser || typeof updatedUser !== "object") {
        updatedUser = { ...(user || {}), ...mePayload };
      }

      // ✅ 저장 성공 시에만 전역(user) 갱신
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      if (isPasswordEditing) {
        await userApi.changePassword({ currentPassword, newPassword });
      }

      // ------------------------------------------------------------
      // [BEFORE] ✅ 이건 네가 짰던 원래 코드라서 내가 주석 처리함
      // alert("저장 완료");
      // ------------------------------------------------------------
      // [CHANGED] 서버 메시지 우선, 없으면 기존 문구
      alert(serverMessage || "저장 완료");

      setIsPasswordEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");

      // 이미지 선택은 "저장 반영"이 아니라 "미리보기"만 했던 상태라
      // UX상 저장 완료 후 초기화해버리는 게 더 깔끔함
      setUploadFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    } catch (err) {
      const message =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : "저장 중 오류가 발생했음");
      setSaveError(message);
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ 원래 회원탈퇴 UX: 위험 카드 클릭 → 모달 열기
  const openWithdraw = () => {
    setWithdrawPassword("");
    setWithdrawConfirmText("");
    setWithdrawChecked(false);
    setIsWithdrawOpen(true);
  };

  const closeWithdraw = () => setIsWithdrawOpen(false);

  const handleWithdraw = async () => {
    if (!withdrawChecked) return alert("탈퇴 안내를 확인하고 체크해야 함");
    if (withdrawConfirmText.trim() !== "탈퇴합니다")
      return alert('확인 문구로 "탈퇴합니다" 를 정확히 입력해야 함');
    if (!withdrawPassword.trim()) return alert("비밀번호를 입력해야 함");

    try {
      await userApi.withdraw({ password: withdrawPassword });
      alert("회원탈퇴 완료");
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : "회원탈퇴 중 오류가 발생했음");
      alert(message);
    } finally {
      closeWithdraw();
    }
  };

  // ✅ 상단 프로필 표시는 "입력값(draft)"이 아니라 "서버 저장값(initial)"만
  const displayName = (initial.displayName || "회원").trim();
  const displayEmail = (initial.email || "").trim();
  const serverAvatarUrl = user?.changeName || "";

  return (
    <main className="fade-in ps-page">
      <header className="content-header">
        <h2>프로필 설정</h2>
        <p className="ps-sub">프로필/계정 정보를 수정하고 저장할 수 있음</p>
      </header>

      <div className="ps-stack">
        <section className="ps-grid">
          <div className="info-card ps-card">
            <div className="ps-card-title">
              <h3>프로필</h3>
            </div>

            <div className="ps-profile-row">
              <div className="profile-img ps-avatar" title="클릭해서 프로필 사진 변경">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectProfileFile}
                  className="ps-file"
                />
                <button
                  type="button"
                  className="ps-avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="프로필 미리보기" />
                  ) : serverAvatarUrl ? (
                    <img src={serverAvatarUrl} alt="프로필 이미지" />
                  ) : (
                    <span aria-hidden>👤</span>
                  )}
                </button>
              </div>

              <div className="ps-profile-meta">
                <div className="ps-meta-name">{displayName}</div>
                <div className="ps-meta-email">{displayEmail}</div>
              </div>
            </div>

            <div className="ps-form">
              <div className="ps-field">
                <label className="ps-label">닉네임</label>
                <input
                  className="ps-input"
                  value={nickName}
                  onChange={(e) => {
                    setNickName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, nickName: "" }));
                  }}
                  onBlur={checkNickNameDuplicate}
                  placeholder="닉네임 입력"
                />
                {fieldErrors.nickName && (
                  <div className="ps-field-error">{fieldErrors.nickName}</div>
                )}
              </div>

              <div className="ps-field">
                <label className="ps-label">이름</label>
                <input
                  className="ps-input"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, userName: "" }));
                  }}
                  onBlur={checkUserNameOnBlur}
                  placeholder="이름 입력(선택)"
                />
                {fieldErrors.userName && (
                  <div className="ps-field-error">{fieldErrors.userName}</div>
                )}
              </div>
            </div>
          </div>

          <div className="info-card ps-card">
            <div className="ps-card-title ps-title-row">
              <h3>계정 정보</h3>
            </div>

            <div className="ps-form">
              <div className="ps-field">
                <label className="ps-label">이메일</label>
                <input
                  className="ps-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  onBlur={checkEmailDuplicate}
                  placeholder="이메일"
                />
                {fieldErrors.email && <div className="ps-field-error">{fieldErrors.email}</div>}
              </div>

              {/* <div className="ps-divider" />

              <div className="ps-field">
                <div className="ps-row-between">
                  <label className="ps-label">비밀번호</label>
                  <button
                    type="button"
                    className="ps-link-btn"
                    onClick={() => setIsPasswordEditing((v) => !v)}
                  >
                    {isPasswordEditing ? "닫기" : "비밀번호 변경"}
                  </button>
                </div>

                {isPasswordEditing && (
                  <div className="ps-password-box">
                    <div className="ps-field">
                      <label className="ps-label">현재 비밀번호</label>
                      <input
                        className="ps-input"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호"
                      />
                    </div>

                    <div className="ps-field">
                      <label className="ps-label">새 비밀번호</label>
                      <input
                        className="ps-input"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="새 비밀번호"
                      />
                    </div>

                    <div className="ps-field">
                      <label className="ps-label">새 비밀번호 확인</label>
                      <input
                        className="ps-input"
                        type="password"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        placeholder="새 비밀번호 확인"
                      />
                    </div>
                  </div>
                )}
              </div> */}
            </div>

            <div className="ps-actions ps-actions-in-card">
              {saveError && <div className="ps-error">{saveError}</div>}
              <button
                type="button"
                className="ps-save-btn"
                onClick={handleSave}
                disabled={!canSubmit}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </section>

        {/* ✅ 너 원래 회원탈퇴 디자인(사진에 나온 카드) */}
        <section className="ps-danger-wrap">
          <div className="info-card ps-danger">
            <div className="ps-danger-title">회원탈퇴</div>
            <div className="ps-danger-desc">
              회원 탈퇴 시 계정 정보 및 데이터는 복구할 수 없습니다. (서버 정책에 따라 비활성화 처리될 수 있습니다.)
            </div>
            <button type="button" className="ps-danger-btn" onClick={openWithdraw}>
              회원탈퇴
            </button>
          </div>
        </section>
      </div>

      {/* ✅ 원래 회원탈퇴 모달 */}
      {isWithdrawOpen && (
        <div className="ps-modal-overlay" role="dialog" aria-modal="true">
          <div className="ps-modal">
            <div className="ps-modal-title">정말 탈퇴하시겠습니까?</div>
            <div className="ps-modal-text">
              아래 내용을 확인하시고, 체크 및 비밀번호를 입력하시면 탈퇴가 진행됩니다. 
            </div>

            <label className="ps-check">
              <input
                type="checkbox"
                checked={withdrawChecked}
                onChange={(e) => setWithdrawChecked(e.target.checked)}
              />
              <span>탈퇴 시 계정 복구가 불가능합니다.</span>
            </label>

            {/* <div className="ps-field" style={{ marginTop: 14 }}>
              <label className="ps-label">확인 문구 입력</label>
              <input
                className="ps-input"
                value={withdrawConfirmText}
                onChange={(e) => setWithdrawConfirmText(e.target.value)}
                placeholder='"탈퇴합니다" 입력'
              />
              <div className="ps-help">정확히 "탈퇴합니다"를 입력해야합니다.</div>
            </div> */}

            <div className="ps-field">
              <label className="ps-label">비밀번호</label>
              <input
                className="ps-input"
                type="password"
                value={withdrawPassword}
                onChange={(e) => setWithdrawPassword(e.target.value)}
                placeholder="비밀번호 입력"
              />
            </div>

            <div className="ps-modal-actions">
              <button type="button" className="ps-btn" onClick={closeWithdraw}>
                취소
              </button>
              <button type="button" className="ps-btn danger" onClick={handleWithdraw}>
                탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ProfileSettings;


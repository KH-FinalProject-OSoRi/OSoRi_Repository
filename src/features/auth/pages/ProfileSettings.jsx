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
  const [isImageRemoved, setIsImageRemoved] = useState(false);

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

  // [ADDED] ✅ 현재 비밀번호 입력란 === 새 비밀번호 입력란이면 경고 문구 노출
  const isSamePw =
    (currentPassword || "").trim() !== "" &&
    (newPassword || "").trim() !== "" &&
    (currentPassword || "").trim() === (newPassword || "").trim();

  // ============================
  // [ADDED] ✅ 여기 추가함 (새 비밀번호 일치/불일치 메시지)
  // ============================
  const [pwMatchMsg, setPwMatchMsg] = useState("");
  const [pwMatchOk, setPwMatchOk] = useState(null); // null | true | false

  //원래 회원탈퇴 디자인(카드 + 모달)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawConfirmText, setWithdrawConfirmText] = useState("");
  const [withdrawChecked, setWithdrawChecked] = useState(false);

  // [ADDED][CHANGED] 탈퇴 중 중복 클릭 방지(디자인 영향 없음)
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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
  const hasProfileImageChanges = !!uploadFile || isImageRemoved;

  const hasPasswordChanges =
    isPasswordEditing && (currentPassword || newPassword || newPasswordConfirm);

  const canSave =
    hasProfileChanges || hasEmailChanges || hasProfileImageChanges || hasPasswordChanges;

  const hasFieldErrors = Boolean(fieldErrors.nickName || fieldErrors.email || fieldErrors.userName);

  // ============================================================
  // [ADDED] ✅ 휴면(H) 여부
  // ============================================================
  const isDormant = user?.status === "H";

  // ------------------------------------------------------------
  // [BEFORE] 기존 로직 (그대로 보관)
  // const canSubmit = canSave && !isSaving && !hasFieldErrors;
  // ------------------------------------------------------------
  // [CHANGED] ✅ 휴면(H)이면 변경사항 없어도 버튼 활성화
  const canSubmit = (canSave || isDormant) && !isSaving && !hasFieldErrors;

  const validate = () => {
    if (!nickName.trim()) return "닉네임은 비울 수 없습니다.";
    if (!email.trim()) return "이메일은 비울 수 없습니다.";
    if (!email.includes("@")) return "이메일 형식이 아닙니다.";

    // 이름은 선택일 수 있으니: 입력했으면 최소 규칙만
    const trimmedUserName = (userName || "").trim();
    if (trimmedUserName && trimmedUserName.length < 2) return "이름은 2글자 이상 입력해주세요.";

    if (isPasswordEditing) {
      if (!currentPassword.trim()) return "현재 비밀번호를 입력해야 합니다.";
      if (!newPassword.trim()) return "새 비밀번호를 입력해야 합니다.";
      if (newPassword.length < 8) return "새 비밀번호는 8자 이상 권장 합니다.";
      if (newPassword !== newPasswordConfirm) return "새 비밀번호 확인이 일치하지 않습니다.";
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

  const handleResetToDefault = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadFile(null);
    setPreviewUrl("");
    setIsImageRemoved(true);
  };

  const handleSelectProfileFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setIsImageRemoved(false);
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

    const loginId = (user?.loginId || "").trim();
    if (!loginId) {
      alert("로그인 정보가 없습니다. 로그인을 다시 하셔야 합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("loginId", loginId);
    formData.append("nickName", (nickName || "").trim());
    formData.append("userName", (userName || "").trim() || "");
    formData.append("email", (email || "").trim().toLowerCase());
    formData.append("status", user?.status || "");

    if (uploadFile) {
      formData.append("profileImage", uploadFile);
    } else if (isImageRemoved) {
      formData.append("isImageRemoved", "true");
    }

    const mePayload = {
      loginId,
      nickName: (nickName || "").trim(),
      userName: (userName || "").trim() || null,
      email: (email || "").trim().toLowerCase(),
      status: user?.status,
    };

    setIsSaving(true);
    setSaveError("");

    try {
      const res = await userApi.updateMe(formData);
      const serverMessage = res?.message; // 서버 message 사용

      let updatedUserFromServer = res?.user || res;

      if (!updatedUserFromServer || typeof updatedUserFromServer !== "object") {
        updatedUserFromServer = { ...(user || {}), ...mePayload };
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
      }
      setUploadFile(null);

      setUser(updatedUserFromServer);
      localStorage.setItem("user", JSON.stringify(updatedUserFromServer));

      if (isPasswordEditing) {
        await userApi.changePassword({ currentPassword, newPassword });
      }

      // [CHANGED] 서버 메시지 우선
      alert(serverMessage || "저장 완료");

      setIsPasswordEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");

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

    // [ADDED][CHANGED] 모달 열릴 때 탈퇴 진행 상태 초기화(디자인 영향 없음)
    setIsWithdrawing(false);

    setIsWithdrawOpen(true);
  };

  const closeWithdraw = () => setIsWithdrawOpen(false);

  const handleWithdraw = async () => {
    // ------------------------------------------------------------
    // [BEFORE] 확인문구까지 강제 (근데 input이 주석 처리돼서 실제로는 탈퇴 막힘)
    // if (!withdrawChecked) return alert("탈퇴 안내를 확인하고 체크해야 함");
    // if (withdrawConfirmText.trim() !== "탈퇴합니다")
    //   return alert('확인 문구로 "탈퇴합니다" 를 정확히 입력해야 함');
    // if (!withdrawPassword.trim()) return alert("비밀번호를 입력해야 함");
    // ------------------------------------------------------------

    // ------------------------------------------------------------
    // [CHANGED] 요구사항: 체크박스 체크 + 비밀번호 입력 시에만 진행
    // ------------------------------------------------------------
    if (!withdrawChecked) return alert("탈퇴 안내를 확인하고 체크해야 함");
    if (!withdrawPassword.trim()) return alert("비밀번호를 입력해야 함");

    // [ADDED][CHANGED] 중복 클릭 방지
    if (isWithdrawing) return;
    setIsWithdrawing(true);

    try {
      // CHANGED 서버 ResponseEntity message 표시
      const res = await userApi.withdraw({ password: withdrawPassword });
      const serverMessage =
        res?.message || (typeof res === "string" ? res : "회원탈퇴 완료");
      alert(serverMessage);

      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      const message =
        err?.data?.message ||
        (typeof err?.data === "string" ? err.data : "회원탈퇴 중 오류가 발생했음");
      alert(message);
    } finally {
      setIsWithdrawing(false);
      closeWithdraw();
    }
  };

  // 상단 프로필 표시는 "입력값(draft)"이 아니라 "서버 저장값(initial)"만
  const displayName = (initial.displayName || "회원").trim();
  const displayEmail = (initial.email || "").trim();
  const serverAvatarUrl = user?.changeName
    ? `http://localhost:8080/osori/upload/profiles/${user.changeName}`
    : "";

  // 탈퇴 버튼 활성화 조건
  const canWithdraw = withdrawChecked && withdrawPassword.trim().length > 0 && !isWithdrawing;

  return (
    <main className="fade-in ps-page">
      <header className="content-header">
        <h2>프로필 설정</h2>
        <p className="ps-sub">프로필/계정 정보를 수정하고 저장할 수 있습니다.</p>
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
                    ) : isImageRemoved ? (
                      <span aria-hidden>👤</span>
                    ) : serverAvatarUrl ? (
                      <img src={serverAvatarUrl} alt="프로필 이미지" />
                    ) : (
                      <span aria-hidden>👤</span>
                    )}
                </button>
              </div>

              <div className="ps-profile-meta">
                <div className="ps-meta-name">{displayName}</div>
                {(previewUrl || (serverAvatarUrl && !isImageRemoved)) && (
                  <button
                    type="button"
                    className="ps-link-btn"
                    style={{ color: '#ff4757', fontSize: '12px', marginTop: '4px' }}
                    onClick={handleResetToDefault}
                  >
                    기본 이미지로 변경
                  </button>
                )}
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
            </div>

            <div className="ps-divider" />

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

                    {isSamePw && (
                      <div className="ps-field-error">
                        현재 비밀번호와 일치합니다. 다른 비밀번호로 입력해주세요.
                      </div>
                    )}
                  </div>

                  <div className="ps-field">
                    <label className="ps-label">새 비밀번호 확인</label>
                    <input
                      className="ps-input"
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      onBlur={(e) => {
                        const a = (newPassword || "").trim();
                        const b = (e.target.value || "").trim();

                        if (!b) {
                          setPwMatchMsg("");
                          setPwMatchOk(null);
                          return;
                        }

                        if (a === b) {
                          setPwMatchMsg("새 비밀번호와 일치합니다.");
                          setPwMatchOk(true);
                        } else {
                          setPwMatchMsg("새 비밀번호와 일치하지 않습니다.");
                          setPwMatchOk(false);
                        }
                      }}
                      placeholder="새 비밀번호 확인"
                    />
                    {pwMatchMsg && (
                      <div className={pwMatchOk ? "ps-help" : "ps-field-error"}>
                        {pwMatchMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ps-actions ps-actions-in-card">
              {saveError && <div className="ps-error">{saveError}</div>}
              <button
                type="button"
                className="ps-save-btn"
                onClick={handleSave}
                disabled={!canSubmit}
                style={
                  isDormant
                    ? { backgroundColor: "#2ecc71", borderColor: "#2ecc71" }
                    : undefined
                }
              >
                {isSaving
                  ? isDormant
                    ? "휴면 해제 중..."
                    : "저장 중..."
                  : isDormant
                  ? "휴면 해제"
                  : "저장"}
              </button>
            </div>
          </div>
        </section>

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

      {isWithdrawOpen && (
        <div className="ps-modal-overlay" role="dialog" aria-modal="true">
          <div className="ps-modal">
            <div className="ps-modal-title">정말 탈퇴하시겠습니까?</div>
            <div className="ps-modal-text">
              아래 내용을 확인하시고, 체크 처리 및 비밀번호를 입력하시면 탈퇴가 진행됩니다.
            </div>

            <label className="ps-check">
              <input
                type="checkbox"
                checked={withdrawChecked}
                onChange={(e) => setWithdrawChecked(e.target.checked)}
              />
              <span>탈퇴 시 계정 복구가 불가능합니다.</span>
            </label>

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
              <button
                type="button"
                className="ps-btn danger"
                onClick={handleWithdraw}
                disabled={!canWithdraw}
              >
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
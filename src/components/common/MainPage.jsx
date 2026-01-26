import "./main.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // [CHANGED] AuthContext 사용

// 각 섹션의 애니메이션 관리를 위한 커스텀 훅
const useScrollAnimation = (threshold = 0.2) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsVisible(entry.isIntersecting));
      },
      { threshold }
    );

    const currentRef = domRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return [domRef, isVisible];
};

const MainPage = () => {
  const [personalRef, isPersonalVisible] = useScrollAnimation();
  const [groupRef, isGroupVisible] = useScrollAnimation();
  const [notificationRef, isNotificationVisible] = useScrollAnimation();

  const navigate = useNavigate();

  const { isAuthenticated, logout } = useAuth(); // [CHANGED] localStorage 직접 조회 제거

  const handleAuthClick = async () => {
    // [CHANGED] 로그인 상태면 로그아웃 API 호출 + 메시지 alert
    if (isAuthenticated) {
      await logout();
      navigate("/", { replace: true }); // 로그아웃 후 어디로 보낼지(원하면 /login도 가능)
      return;
    }

    // [CHANGED] 비로그인 상태면 로그인 페이지로 이동
    navigate("/login");
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="nav-content">
          <a href="/" className="logo" onClick={() => navigate("/")}>
            OSORI
          </a>

          {/* ✅ [추가] 로그인/로그아웃 버튼과 같은 영역에 "마이페이지" 버튼 추가 */}
          <div className="nav-actions">
            {isAuthenticated && (
              <button
                className="cta-button secondary"
                type="button"
                onClick={() => navigate("/mypage")}
              >
                마이페이지
              </button>
            )}


            <button className="cta-button" onClick={handleAuthClick}>
              {isAuthenticated ? "로그아웃" : "로그인"} {/* [CHANGED] 상태 기준 */}
            </button>
          </div>
        </div>
      </nav>

      <section className="main-section">
        <h1 className="main-title">
          나보다 나를 더 잘 아는
          <br />
          <span>자산 관리 파트너</span>
        </h1>
        <p className="main-desc">
          복잡한 금융 데이터, OSORI가 하나로 모아 분석해 드립니다.
        </p>
      </section>

      <section className="section" style={{ padding: "80px 0" }}>
        <div
          ref={personalRef}
          className="content-wrapper"
          style={{
            opacity: isPersonalVisible ? 1 : 0,
            transform: isPersonalVisible ? "translateY(0)" : "translateY(50px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
            textAlign: "center",
          }}
        >
          <h2 className="section-title">개인 가계부</h2>
          <p className="section-description">
            나만의 소비패턴 분석과 뱃지 획득으로 <br />
            더 스마트한 자산 관리를 경험하세요.
          </p>

          <div
            className="feature-image-small"
            style={{ margin: "40px auto 0", background: "#FFEBEE" }}
          >
            <div style={{ fontSize: "4rem" }}></div>
          </div>

          <div className="badge-display-inline">
            <div className="badge-item-small"> 소비패턴 분석</div>
            <div className="badge-item-small"> 뱃지 획득</div>
          </div>
        </div>
      </section>

      {/* 5. 그룹 가계부 기능 소개 섹션 */}
      <section
        className="section"
        style={{ backgroundColor: "#F9FBFF", padding: "80px 0" }}
      >
        <div
          ref={groupRef}
          className="content-wrapper"
          style={{
            opacity: isGroupVisible ? 1 : 0,
            transform: isGroupVisible ? "translateY(0)" : "translateY(50px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
            textAlign: "center",
          }}
        >
          <h2 className="section-title">그룹 가계부</h2>
          <p className="section-description">
            가족/연인과 함께 수입/지출을 관리하고 <br />
            재미있는 챌린지를 통해 뱃지를 획득하세요.
          </p>

          <div
            className="feature-image-small"
            style={{ margin: "40px auto 0", background: "#E8F5E9" }}
          >
            <div style={{ fontSize: "4rem" }}></div>
          </div>

          <div className="badge-display-inline">
            <div className="badge-item-small"> 공동 관리</div>
            <div className="badge-item-small"> 챌린지 뱃지</div>
          </div>
        </div>
      </section>

      {/* 6. 실시간 알림 기능 소개 섹션 */}
      <section className="section" style={{ padding: "80px 0" }}>
        <div
          ref={notificationRef}
          className="content-wrapper"
          style={{
            opacity: isNotificationVisible ? 1 : 0,
            transform: isNotificationVisible
              ? "translateY(0)"
              : "translateY(50px)",
            transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
            textAlign: "center",
          }}
        >
          <h2 className="section-title">실시간 알림</h2>
          <p className="section-description">
            초대 알림, 수입/지출 내역 추가 알림을 <br />
            실시간으로 알려드립니다.
          </p>

          <div
            className="notification-mockup-main"
            style={{ margin: "40px auto 0" }}
          >
            <div style={{ fontSize: "4rem" }}></div>
            <p
              style={{
                margin: "15px 0 0",
                fontSize: "1.1rem",
                fontWeight: "600",
              }}
            >
              '오소리'님이 그룹 가계부에 지출 150,000원을 추가했어요.
            </p>
          </div>
        </div>
      </section>

      <section className="feature-section">
        <div className="card-grid">
          <div className="feature-card">
            <span className="icon-box"></span>
            <h3>똑똑한 자산 관리</h3>
            <p>내 소비 내역 데이터를 한눈에 확인하세요.</p>
          </div>

          <div className="feature-card">
            <span className="icon-box"></span>
            <h3>지출 캘린더</h3>
            <p>언제 어디서 돈을 썼는지 달력으로 한눈에 파악한다.</p>
          </div>

          <div className="feature-card">
            <span className="icon-box"></span>
            <h3>안심 보안 서비스</h3>
            <p>강력한 보안 기술로 소중한 정보를 안전하게 보호한다.</p>
          </div>
        </div>
      </section>

      <div className="footer">© 2026 OSORI. 서채원 / 전성중 / 조수인 / 강민채.</div>
    </div>
  );
};

export default MainPage;


// import "./main.css";
// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext"; // [CHANGED] AuthContext 사용

// // 각 섹션의 애니메이션 관리를 위한 커스텀 훅
// const useScrollAnimation = (threshold = 0.2) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const domRef = useRef();

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => setIsVisible(entry.isIntersecting));
//       },
//       { threshold }
//     );

//     const currentRef = domRef.current;

//     if (currentRef) {
//       observer.observe(currentRef);
//     }

//     return () => {
//       if (currentRef) {
//         observer.unobserve(currentRef);
//       }
//     };
//   }, [threshold]);

//   return [domRef, isVisible];
// };

// const MainPage = () => {
//   const [personalRef, isPersonalVisible] = useScrollAnimation();
//   const [groupRef, isGroupVisible] = useScrollAnimation();
//   const [notificationRef, isNotificationVisible] = useScrollAnimation();

//   const navigate = useNavigate();

//   const { isAuthenticated, logout } = useAuth(); // [CHANGED] localStorage 직접 조회 제거

//   const handleAuthClick = async () => {
//     // [CHANGED] 로그인 상태면 로그아웃 API 호출 + 메시지 alert
//     if (isAuthenticated) {
//       await logout();
//       navigate("/", { replace: true }); // 로그아웃 후 어디로 보낼지(원하면 /login도 가능)
//       return;
//     }

//     // [CHANGED] 비로그인 상태면 로그인 페이지로 이동
//     navigate("/login");
//   };

//   return (
//     <div className="container">
//       <nav className="navbar">
//         <div className="nav-content">
//           <a href="/" className="logo" onClick={() => navigate("/")}>
//             OSORI
//           </a>

//           {/* ✅ [추가] 로그인/로그아웃 버튼과 같은 영역에 "마이페이지" 버튼 추가 */}
//           <div className="nav-actions">
//             {isAuthenticated && (
//               <button
//                 className="cta-button secondary"
//                 type="button"
//                 onClick={() => navigate("/mypage")}
//               >
//                 마이페이지
//               </button>
//             )}

//             <button className="cta-button" type="button" onClick={handleAuthClick}>
//               {isAuthenticated ? "로그아웃" : "로그인"} {/* [CHANGED] 상태 기준 */}
//             </button>
//           </div>
//         </div>
//       </nav>

//       {/* 메인 소개 */}
//       <section className="main-section">
//         <h1 className="main-title">
//           나보다 나를 더 잘 아는
//           <br />
//           <span>자산 관리 파트너</span>
//         </h1>
//         <p className="main-subtitle">
//           OSoRi는 사용자의 소비 습관을 분석해
//           <br />
//           맞춤형 자산관리 서비스를 제공한다.
//         </p>

//         <button className="cta-button main-cta" onClick={() => navigate("/login")}>
//           지금 시작하기
//         </button>
//       </section>

//       {/* 기능 1 - 개인 자산 관리 */}
//       <section className="feature-section">
//         <div
//           ref={personalRef}
//           className={`feature-content ${
//             isPersonalVisible ? "fade-in" : "fade-out"
//           }`}
//         >
//           <h2 className="section-title">개인 자산관리</h2>
//           <p className="section-description">
//             나만의 소비 패턴을 분석하고 예산 목표를 세워
//             <br />
//             더 나은 재정 습관을 만들어준다.
//           </p>

//           <div className="feature-card">
//             <img
//               src="/assets/personal.png"
//               alt="개인 자산관리"
//               className="feature-image"
//             />
//           </div>
//         </div>
//       </section>

//       {/* 기능 2 - 그룹 자산 관리 */}
//       <section className="feature-section">
//         <div
//           ref={groupRef}
//           className={`feature-content ${
//             isGroupVisible ? "fade-in" : "fade-out"
//           }`}
//         >
//           <h2 className="section-title">그룹 자산관리</h2>
//           <p className="section-description">
//             친구, 가족과 함께 예산을 공유하고
//             <br />
//             공동 목표를 설정할 수 있다.
//           </p>

//           <div className="feature-card">
//             <img
//               src="/assets/group.png"
//               alt="그룹 자산관리"
//               className="feature-image"
//             />
//           </div>
//         </div>
//       </section>

//       {/* 기능 3 - 알림 기능 */}
//       <section className="feature-section">
//         <div
//           ref={notificationRef}
//           className={`feature-content ${
//             isNotificationVisible ? "fade-in" : "fade-out"
//           }`}
//         >
//           <h2 className="section-title">알림 기능</h2>
//           <p className="section-description">
//             예산 초과, 목표 달성 등 중요한 순간에
//             <br />
//             실시간 알림을 받을 수 있다.
//           </p>

//           <div className="feature-card">
//             <img
//               src="/assets/notification.png"
//               alt="알림 기능"
//               className="feature-image-small"
//             />
//           </div>
//         </div>
//       </section>

//       {/* 푸터 */}
//       <footer className="footer">
//         <p>© 2026 OSoRi. All rights reserved.</p>
//       </footer>
//     </div>
//   );
// };

// export default MainPage;






// import "./main.css";
// import { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext"; // [CHANGED] AuthContext로 로그인 상태/로그아웃 처리

// // 각 섹션의 애니메이션 관리를 위한 커스텀 훅
// const useScrollAnimation = (threshold = 0.2) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const domRef = useRef();

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => setIsVisible(entry.isIntersecting));
//       },
//       { threshold }
//     );

//     const currentRef = domRef.current;

//     if (currentRef) {
//       observer.observe(currentRef);
//     }

//     return () => {
//       if (currentRef) {
//         observer.unobserve(currentRef);
//       }
//     };
//   }, [threshold]);

//   return [domRef, isVisible];
// };

// const MainPage = () => {
//   const [personalRef, isPersonalVisible] = useScrollAnimation();
//   const [groupRef, isGroupVisible] = useScrollAnimation();
//   const [notificationRef, isNotificationVisible] = useScrollAnimation();

//   const navigate = useNavigate();
//   const { isAuthenticated, logout } = useAuth(); // [CHANGED] 토큰 여부를 localStorage 직접조회 대신 Context 상태로 받음

//   const handleAuthButtonClick = () => {
//     // [CHANGED] 로그인 상태면 로그아웃, 아니면 로그인 페이지로 이동
//     if (isAuthenticated) {
//       logout();
//       navigate("/", { replace: true });
//       return;
//     }
//     navigate("/login");
//   };

//   return (
//     <div className="container">
//       <nav className="navbar">
//         <div className="nav-content">
//           <a href="/" className="logo" onClick={() => navigate("/")}>
//             OSORI
//           </a>

//           {/* [CHANGED] 토큰 있으면 로그아웃 / 없으면 로그인 페이지 이동 */}
//           <button className="cta-button" onClick={handleAuthButtonClick}>
//             {isAuthenticated ? "로그아웃" : "로그인"}
//           </button>
//         </div>
//       </nav>

//       <section className="main-section">
//         <h1 className="main-title">
//           나보다 나를 더 잘 아는
//           <br />
//           <span>자산 관리 파트너</span>
//         </h1>
//         <p className="main-desc">
//           복잡한 금융 데이터, OSORI가 하나로 모아 분석해 드립니다.
//         </p>
//       </section>

//       <section className="section" style={{ padding: "80px 0" }}>
//         <div
//           ref={personalRef}
//           className="content-wrapper"
//           style={{
//             opacity: isPersonalVisible ? 1 : 0,
//             transform: isPersonalVisible ? "translateY(0)" : "translateY(50px)",
//             transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
//             textAlign: "center",
//           }}
//         >
//           <h2 className="section-title">개인 가계부</h2>
//           <p className="section-description">
//             나만의 소비패턴 분석과 뱃지 획득으로 <br />
//             더 스마트한 자산 관리를 경험하세요.
//           </p>

//           <div
//             className="feature-image-small"
//             style={{ margin: "40px auto 0", background: "#FFEBEE" }}
//           >
//             <div style={{ fontSize: "4rem" }}></div>
//           </div>

//           <div className="badge-display-inline">
//             <div className="badge-item-small"> 소비패턴 분석</div>
//             <div className="badge-item-small"> 뱃지 획득</div>
//           </div>
//         </div>
//       </section>

//       {/* 5. 그룹 가계부 기능 소개 섹션 */}
//       <section
//         className="section"
//         style={{ backgroundColor: "#F9FBFF", padding: "80px 0" }}
//       >
//         <div
//           ref={groupRef}
//           className="content-wrapper"
//           style={{
//             opacity: isGroupVisible ? 1 : 0,
//             transform: isGroupVisible ? "translateY(0)" : "translateY(50px)",
//             transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
//             textAlign: "center",
//           }}
//         >
//           <h2 className="section-title">그룹 가계부</h2>
//           <p className="section-description">
//             가족/연인과 함께 수입/지출을 관리하고 <br />
//             재미있는 챌린지를 통해 뱃지를 획득하세요.
//           </p>

//           <div
//             className="feature-image-small"
//             style={{ margin: "40px auto 0", background: "#E8F5E9" }}
//           >
//             <div style={{ fontSize: "4rem" }}></div>
//           </div>

//           <div className="badge-display-inline">
//             <div className="badge-item-small"> 공동 관리</div>
//             <div className="badge-item-small"> 챌린지 뱃지</div>
//           </div>
//         </div>
//       </section>

//       {/* 6. 실시간 알림 기능 소개 섹션 */}
//       <section className="section" style={{ padding: "80px 0" }}>
//         <div
//           ref={notificationRef}
//           className="content-wrapper"
//           style={{
//             opacity: isNotificationVisible ? 1 : 0,
//             transform: isNotificationVisible
//               ? "translateY(0)"
//               : "translateY(50px)",
//             transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
//             textAlign: "center",
//           }}
//         >
//           <h2 className="section-title">실시간 알림</h2>
//           <p className="section-description">
//             초대 알림, 수입/지출 내역 추가 알림을 <br />
//             실시간으로 알려드립니다.
//           </p>

//           <div
//             className="notification-mockup-main"
//             style={{ margin: "40px auto 0" }}
//           >
//             <div style={{ fontSize: "4rem" }}></div>
//             <p
//               style={{
//                 margin: "15px 0 0",
//                 fontSize: "1.1rem",
//                 fontWeight: "600",
//               }}
//             >
//               '오소리'님이 그룹 가계부에 지출 150,000원을 추가했어요.
//             </p>
//           </div>
//         </div>
//       </section>

//       <section className="feature-section">
//         <div className="card-grid">
//           <div className="feature-card">
//             <span className="icon-box"></span>
//             <h3>똑똑한 자산 관리</h3>
//             <p>내 소비 내역 데이터를 한눈에 확인하세요.</p>
//           </div>

//           <div className="feature-card">
//             <span className="icon-box"></span>
//             <h3>지출 캘린더</h3>
//             <p>언제 어디서 돈을 썼는지 달력으로 한눈에 파악한다.</p>
//           </div>

//           <div className="feature-card">
//             <span className="icon-box"></span>
//             <h3>안심 보안 서비스</h3>
//             <p>강력한 보안 기술로 소중한 정보를 안전하게 보호한다.</p>
//           </div>
//         </div>
//       </section>

//       <div className="footer">
//         © 2026 OSORI. 서채원 / 전성중 / 조수인 / 강민채.
//       </div>
//     </div>
//   );
// };



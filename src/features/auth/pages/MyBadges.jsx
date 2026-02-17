import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./MyBadges.css";
import { useAuth } from "../../../context/AuthContext";

const API_BASE = "http://localhost:8080/osori";

/**
 * 기대 응답(예시)
 * [
 *  {
 *    badgeId, badgeName, badgeIconUrl,
 *    challengeMode: "PERSONAL" | "GROUP",
 *    challengeName,
 *    earnedAt,
 *    groupbName // 그룹일 때만
 *  }
 * ]
 */
export default function MyBadges() {
  const { user } = useAuth();      // user.userId 존재
  const userId = user?.userId;

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      // ✅ 너 프로젝트의 뱃지 전체 조회 엔드포인트에 맞춰서 수정
      // 예: /api/badges/{userId} 가 "전체(개인+그룹)"를 내려준다는 가정
      const res = await axios.get(`${API_BASE}/api/badges/${userId}`);
      setBadges(Array.isArray(res.data) ? res.data : []);

    // api 호출 콘솔주석
      console.log("badges raw:", res.data);


    } catch (e) {
      console.error("뱃지 목록 조회 실패:", e);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

//그룹뱃지 비어있을경우 애니메이션 추가
  const renderEmptyGroupSection = () => {
  return (
    <section className="badge-section">
      <div className="section-head">
        <div>
          <h2 className="section-title">그룹 뱃지</h2>
          <p className="section-sub">
            함께 도전해서 성공했을 때 받는 뱃지예요.
          </p>
        </div>
        <div className="section-count">0개</div>
      </div>

      <div className="section-content-card group-empty">
        <div className="belt">
          {[...Array(20)].map((_, i) => (
            <img
              key={i}
              src={`http://localhost:8080${badgeIconUrl}`}
              alt="locked"
              className="belt-item"
            />
          ))}
        </div>

        <div className="empty-overlay">
          그룹 가계부를 생성하고 그룹 챌린지에 참가하세요!
        </div>
      </div>

    </section>
  );
};



  useEffect(() => {
    if (!userId) return;
    fetchBadges();
    }, [userId]);

  const { personalBadges, groupBadges } = useMemo(() => {
    const personal = [];
    const group = [];

    for (const b of badges) {
      const challengeId =
        b.challengeId || b.CHALLENGE_ID || "";

      // 🔥 group_ 로 시작하면 그룹
      if (challengeId.toLowerCase().startsWith("group_")) {
        group.push(b);
      } else {
        personal.push(b);
      }
    }

    const getTime = (b) => {
      const v =
        b.earnedAt ||
        b.issuedAt ||
        b.createdAt ||
        b.earned_at ||
        b.issued_at;
      return v ? new Date(v).getTime() : 0;
    };

    personal.sort((a, b) => getTime(b) - getTime(a));
    group.sort((a, b) => getTime(b) - getTime(a));

    return { personalBadges: personal, groupBadges: group };
  }, [badges]);


  // const { personalBadges, groupBadges } = useMemo(() => {
  //   const getMode = (b) =>
  //     (b.challengeMode || b.challenge_mode || b.mode || "").toString().toUpperCase();

  //   const personal = [];
  //   const group = [];

  //   for (const b of badges) {
  //   const challengeId = b.challengeId ?? b.CHALLENGE_ID ?? b.challenge_id;
  //   if (challengeId) group.push(b);
  //   else personal.push(b);
  //   }


  //   // 최근 발급일이 먼저 오게 정렬 (있을 때만)
  //   const getTime = (b) => {
  //     const v = b.earnedAt || b.issuedAt || b.createdAt || b.earned_at || b.issued_at;
  //     return v ? new Date(v).getTime() : 0;
  //   };

  //   personal.sort((a, b) => getTime(b) - getTime(a));
  //   group.sort((a, b) => getTime(b) - getTime(a));

  //   return { personalBadges: personal, groupBadges: group };
  // }, [badges]);

  const renderBadgeCard = (b) => {
    const iconUrl = b.badgeIconUrl || b.badge_icon_url || "";
    const imgSrc = iconUrl
      ? `http://localhost:8080${iconUrl}`
      : "";

    
    // 1. 그룹 뱃지 판별 로직 강화
    // 모드가 GROUP이거나, groupBudgetTitle 값이 실제로 존재할 때 그룹 뱃지로 간주합니다.
    const isGroupBadge = (b.challengeMode || "").toUpperCase() === 'GROUP' || !!(b.groupBudgetTitle || b.group_budget_title);

    const title =
      b.badgeId === 1
        ? "아기 오소리(회원가입)"
        : (b.challengeDesc || b.challenge_desc || b.badgeName || b.badge_name || "뱃지");

    const earnedRaw = b.earnedAt || b.earned_at;
    const earnedText = earnedRaw ? new Date(earnedRaw).toLocaleDateString("ko-KR") : "0000.00.00";

    // 2. 고유 키(Key) 생성
    // 동일 유저가 같은 날 여러 그룹에서 뱃지를 따더라도 중복되지 않도록 groupId를 조합합니다.
    const gId = b.groupId || b.GROUPB_ID || (b.groupBudgetTitle ? 'group' : 'personal');
    const uniqueKey = `${b.badgeId || b.badge_id}-${earnedRaw}-${gId}`;

    return (
      <div className={`badgecard ${isGroupBadge ? "group-card" : ""}`} key={uniqueKey}>
        
        {/* 🔥 그룹 가계부 라벨 */}
        {isGroupBadge && (b.groupBudgetTitle || b.group_budget_title) && (
          <div className="group-budget-pill">
            {b.groupBudgetTitle || b.group_budget_title}
          </div>
        )}

        <div className="badge-imgwrap">
          {imgSrc ? (
            <img className="badge-img" src={imgSrc} alt={title} />
          ) : (
            <div className="badge-fallback">🏅</div>
          )}
        </div>

        <div className="badgecard-right">
          <div className="badge-name">{title}</div>
          <div className="badge-meta">
            <span className="meta-label">발급일</span>
            <span className="meta-value">{earnedText}</span>
          </div>
        </div>
      </div>
    );

  };

  const renderSection = (title, subtitle, list, isGroup) => {
    const TOTAL_PERSONAL_SLOTS = 4;
    let displayList = [...list];

    if (!isGroup) {
      if (displayList.length < TOTAL_PERSONAL_SLOTS) {
        const lockedCount = TOTAL_PERSONAL_SLOTS - displayList.length - 1;

        // 먼저 locked 채우기
        for (let i = 0; i < lockedCount; i++) {
          displayList.push({ isLocked: true, id: `locked-${i}` });
        }

        // 마지막에 Coming Soon 추가
        displayList.push({ isComingSoon: true, id: "coming-soon" });
      }
    }



    return (
      <section className="badge-section">
        <div className="section-head">
          <div>
            <h2 className="section-title">{title}</h2>
            <p className="section-sub">{subtitle}</p>
          </div>
          <div className="section-count">{list.length}개</div>
        </div>

        <div className="section-content-card">
          <div className="badge-list">
            {displayList.map((b) => {

  if (b.isComingSoon) {
      return (
        <div className="badgecard coming-soon" key={b.id}>
          <div className="badge-imgwrap blur">
            <img
              className="badge-img"
              src={`${API_BASE}/upload/badges/locked.png`}
              alt="coming soon"
            />
          </div>
          <div className="badgecard-right">
            <div className="badge-name">Coming Soon</div>
            <div className="badge-meta">
              <span className="meta-value">곧 업데이트됩니다</span>
            </div>
          </div>
        </div>
      );
    }

    if (b.isLocked) {
      return (
        <div className="badgecard locked" key={b.id}>
          <div className="badge-imgwrap blur">
            <img
              className="badge-img"
              src={`${API_BASE}/upload/badges/locked.png`}
              alt="잠긴 뱃지"
            />
          </div>
          <div className="badgecard-right">
            <div className="badge-name">??</div>
            <div className="badge-meta">
              <span className="meta-value">도전하여 획득하세요!</span>
            </div>
          </div>
        </div>
      );
    }

    return renderBadgeCard(b);
  })}

          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="fade-in">
        <div className="mybadges-page">
        <div className="mybadges-header">
            <div>
            <h2 className="mybadges-title">내 뱃지</h2>
            <p className="mybadges-subtitle">
                개인/그룹 챌린지에서 획득한 뱃지를 분리해서 보여드려요.
            </p>
            </div>
        </div>

        {loading ? (
            <div className="state-card">
            <div className="spinner" />
            <div className="state-text">뱃지 정보를 불러오는 중...</div>
            </div>
        ) : (
            <>
            {/* ✅ 상단: 개인 */}
            {renderSection(
                "개인 뱃지",
                "혼자서 꾸준히 챌린지 달성! 기록이 쌓일수록 뱃지도 늘어나요.",
                personalBadges,
                false
            )}

            {/* ✅ 하단: 그룹 */}
            {groupBadges.length === 0
              ? renderEmptyGroupSection()
              : renderSection(
                  "그룹 뱃지",
                  "함께 도전해서 성공했을 때 받는 뱃지예요. 어떤 가계부에서 받았는지도 확인해요.",
                  groupBadges,
                  true
                )
            }
            </>
        )}
        </div>
    </main>
  );

}


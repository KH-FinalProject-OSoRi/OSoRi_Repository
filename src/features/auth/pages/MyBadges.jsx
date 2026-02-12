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

  useEffect(() => {
    if (!userId) return;
    fetchBadges(userId);
    }, [userId]);


  useEffect(() => {
    fetchBadges();
    // eslint-disable-next-line
  }, [userId]);

  const { personalBadges, groupBadges } = useMemo(() => {
    const personal = [];
    const group = [];

    for (const b of badges) {
      // 백엔드에서 받아온 challengeMode 값을 확인 (대문자로 비교)
      // b.challengeMode(Mapper alias) 또는 b.CHALLENGE_MODE(DB raw) 대응
      const mode = (b.challengeMode || b.CHALLENGE_MODE || "").toString().toUpperCase();

      // 1. 뱃지 ID가 1(가입뱃지)이거나 모드가 PERSONAL이면 개인 뱃지로 분류
      if (b.badgeId === 1 || mode === 'PERSONAL') {
        personal.push(b);
      } 
      // 2. 모드가 GROUP이면 그룹 뱃지로 분류
      else if (mode === 'GROUP') {
        group.push(b);
      } 
      // 3. 예외 케이스: 모드 정보가 없는데 challengeId가 있다면 그룹으로 간주 (기존 데이터 호환)
      else if (b.challengeId || b.CHALLENGE_ID) {
        group.push(b);
      }
      else {
        personal.push(b);
      }
    }

    // 최근 발급일이 먼저 오게 정렬
    const getTime = (b) => {
      const v = b.earnedAt || b.issuedAt || b.createdAt || b.earned_at || b.issued_at;
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
    const imgSrc = iconUrl ? `${API_BASE}${iconUrl}` : "";
    
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
      <div className="badgecard" key={uniqueKey}>
        {/* 그룹 뱃지일 때만 상단에 가계부 이름 표시 */}
        {isGroupBadge && (b.groupBudgetTitle || b.group_budget_title) && (
          <div style={{ fontSize: '12px', color: '#0066ff', marginTop: '2px', fontWeight: 'bold' }}>
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
    // 개인 뱃지인 경우 총 3개가 되도록 모자란 개수를 계산
    const TOTAL_PERSONAL_SLOTS = 3;
    const displayList = [...list];
    
    // 개인 뱃지 섹션이고 리스트가 3개보다 적다면 실루엣 추가
    if (!isGroup && displayList.length < TOTAL_PERSONAL_SLOTS) {
      const missingCount = TOTAL_PERSONAL_SLOTS - displayList.length;
      for (let i = 0; i < missingCount; i++) {
        displayList.push({ isLocked: true, id: `locked-${i}` });
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
              // 잠긴 뱃지인 경우 별도의 실루엣 카드 렌더링
              if (b.isLocked) {
                return (
                  <div className="badgecard locked" key={b.id}>
                    <div className="badge-imgwrap silhouette">
                      {/* 오소리 실루엣 이미지 경로가 있다면 img 태그를 사용하세요 */}
                      <img className="badge-img" src={`${API_BASE}/upload/badges/locked.png`} alt="잠긴 뱃지" />
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
              // 기존 획득한 뱃지 렌더링
              return renderBadgeCard(b, isGroup);
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
            {renderSection(
                "그룹 뱃지",
                "함께 도전해서 성공했을 때 받는 뱃지예요. 어떤 가계부에서 받았는지도 확인해요.",
                groupBadges,
                true
            )}
            </>
        )}
        </div>
    </main>
  );

}


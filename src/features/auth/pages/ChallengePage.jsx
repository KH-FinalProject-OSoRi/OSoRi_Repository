import React, { useEffect, useMemo, useState } from "react";
import "./ChallengePage.css";
import "./MyPage.css";
import { challengeApi } from "../../../api/challengeApi.js";
import { useAuth } from "../../../context/AuthContext";
import { useGroupBudgets } from "../../../hooks/useGroupBudgets";
import { useSearchParams, useNavigate } from "react-router-dom";

const getValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
};

const getTimeLeft = (endDateStr) => {
  if (!endDateStr) return "";
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return "마감됨";
  
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  
  return d > 0 ? `${d}일 ${h}시간 남음` : `${h}시간 ${m}분 남음`;
};

export default function ChallengePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayName = useMemo(() => {
    return (
      user?.nickName ||
      user?.nickname ||
      user?.userName ||
      user?.loginId ||
      "회원"
    );
  }, [user]);

  const [challengeMode, setChallengeMode] = useState("PERSONAL");
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const { groupBudgetList = [], isLoading: isGroupLoading } = useGroupBudgets(user?.userId);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [rankings, setRankings] = useState({});
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get("groupId");

  // 개인 챌린지의 실시간 진행 수치를 저장하는 상태
  const [progressMap, setProgressMap] = useState({});

  // 참여 모달
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [joinForm, setJoinForm] = useState({ startDate: "", endDate: "" });
  const [joinMsg, setJoinMsg] = useState("");

  const [joinedMap, setJoinedMap] = useState({});

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyMsg, setHistoryMsg] = useState("");

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.list)) return data.list;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  const parseDate = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v.slice(0, 10);
    try {
      return new Date(v).toISOString().slice(0, 10);
    } catch (e) {
      return "";
    }
  };

  const fmtType = (t) => {
    if (t === "IN") return "수입";
    if (t === "OUT" || t === "EXPENSE" ) return "지출";
    return t || "-";
  };

  const fmtMode = (m) => {
    if (m === "PERSONAL") return "개인";
    if (m === "GROUP") return "그룹";
    return m || "-";
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const calcEndDate = (startDate, duration, mode) => {
    const d = new Date(startDate);
    const rawDuration = Math.max(1, duration);
    
    //그룹 챌린지의 경우 -1 제거
    if (mode === "GROUP") {
      d.setDate(d.getDate() + rawDuration);
    } else {
      d.setDate(d.getDate() + (rawDuration - 1));
    }
    
    return d.toISOString().slice(0, 10);
  };

  // const openJoin = (challenge) => {
  //   setSelected(challenge);
  //   const start = todayStr;
  //   const end = calcEndDate(start, challenge?.duration || 1);
  //   setJoinForm({ startDate: start, endDate: end });
  //   setJoinMsg("");
  //   setIsJoinOpen(true);
  // };

  const openJoin = (challenge) => {
    setSelected(challenge);

    let start = todayStr;
    let end = "";

    // ✅ 무지출 그룹 챌린지일 경우 → 다음날 하루로 고정
    if (
      challengeMode === "GROUP" &&
      challenge?.challengeId === "group_zero_challenge"
    ) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const formatted = tomorrow.toISOString().slice(0, 10);

      start = formatted;
      end = formatted;
    }
    else if (challenge?.duration === 0 && challengeMode === "GROUP") {
      const selectedGroup = groupBudgetList.find(
        (g) => String(g.groupbId) === String(selectedGroupId)
      );

      if (selectedGroup?.endDate) {
        end = selectedGroup.endDate.slice(0, 10);
      }
    } 
    else {
      end = calcEndDate(start, challenge?.duration || 1, challengeMode);
    }

    setJoinForm({ startDate: start, endDate: end });
    setJoinMsg("");
    setIsJoinOpen(true);
  };


  const closeJoin = () => {
    setIsJoinOpen(false);
    setSelected(null);
    setJoinMsg("");
  };

  const openHistory = async () => {
    if (!user?.userId) {
      setHistoryMsg("로그인이 필요함");
      setIsHistoryOpen(true);
      return;
    }

    if (challengeMode === "GROUP" && !selectedGroupId) {
      setHistoryMsg("조회할 그룹 가계부를 선택해주세요.");
      setIsHistoryOpen(true);
      return;
    }

    setHistoryList([]);
    setHistoryMsg("");
    setIsHistoryOpen(true);

    try {
      let data;
      if (challengeMode === "GROUP") {
        data = await challengeApi.getGroupPastChallengeList(selectedGroupId, user.userId); 
      } else {
        data = await challengeApi.myPastJoinedList({
          userId: user.userId,
          challengeMode,
        });
      }
      
      setHistoryList(normalizeList(data));
    } catch (e) {
      setHistoryMsg(e?.message || "지난 챌린지 목록을 불러오지 못했음");
      setHistoryList([]);
    }
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
    setHistoryList([]);
    setHistoryMsg("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJoinForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadList = async (mode) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const data = await challengeApi.list({ challengeMode: mode });
      setList(normalizeList(data));
    } catch (e) {
      setErrorMsg("챌린지 목록을 불러오지 못했음");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async (id) => {
    if (!user?.userId) return;
    try {
      const data = await challengeApi.getChallengeProgress(user.userId, id); 
      setProgressMap(prev => ({ ...prev, [id]: data }));
    } catch (e) {
      console.error(`진행도 로드 실패 (${id}):`, e);
    }
  };

  // const loadMyJoined = async (mode) => {
  //   if (!user?.userId) return;
  //   setJoinedMap({});
  //   try {
  //     let data;
  //     if (mode === "GROUP") {
  //       if (!selectedGroupId) return;
  //       data = await challengeApi.getGroupJoinedList(selectedGroupId, user.userId); 
  //     } else {
  //       data = await challengeApi.myJoinedList({
  //         userId: user.userId,
  //         challengeMode: mode,
  //       });
  //     }

  //     const arr = normalizeList(data);
  //     const map = {};
  //     arr.forEach((row) => {
  //       const id = row?.challengeId || row?.challenge_id;
  //       if (!id) return;
  //       map[String(id)] = {
  //         status: row?.status,
  //         startDate: parseDate(row?.startDate || row?.start_date),
  //         endDate: parseDate(row?.endDate || row?.end_date),
  //       };
  //       if (mode === "PERSONAL" && row.status === "PROCEEDING") {
  //         fetchProgress(id);
  //       }
  //     });
  //     setJoinedMap(map);
  //   } catch (e) {
  //     console.error("참여 목록 로드 실패", e);
  //   }
  // };

  const loadMyJoined = async (mode) => {
    if (!user?.userId) return;
    setJoinedMap({});
    try {
      let data;
      if (mode === "GROUP") {
        if (!selectedGroupId) return;
        data = await challengeApi.getGroupJoinedList(selectedGroupId, user.userId); 
      } else {
        data = await challengeApi.myJoinedList({ userId: user.userId, challengeMode: mode });
      }

      const arr = normalizeList(data);
      const map = {};
      arr.forEach((row) => {
        // id 추출 시 대소문자 모두 대응
        const id = row?.challengeId || row?.challenge_id || row?.CHALLENGE_ID;
        if (!id) return;
        
        map[String(id)] = {
          status: row?.status || row?.STATUS,
          // 원본 데이터를 그대로 들고 있어야 ChallengeGauge와 버튼 로직이 정확해집니다.
          startDate: row?.startDate || row?.start_date || row?.START_DATE,
          endDate: row?.endDate || row?.end_date || row?.END_DATE,
        };
        
        if (mode === "PERSONAL" && (row.status === "PROCEEDING" || row.STATUS === "PROCEEDING")) {
          fetchProgress(id);
        }
      });
      setJoinedMap(map);
    } catch (e) {
      console.error("참여 목록 로드 실패", e);
    }
  };

  const loadRanking = async (challengeId) => {
    try {
      const data = await challengeApi.getGroupRanking(selectedGroupId, challengeId);
      setRankings(prev => ({ ...prev, [challengeId]: data }));
    } catch (e) {
      console.error("순위 로드 실패", e);
    }
  };

  const filteredList = useMemo(() => {
    if (challengeMode === "GROUP") {
      if (!selectedGroupId) return []; 
      return list.filter(c => {
        const challengeGroupId = c.groupbId || c.group_id || c.groupId;
        if (challengeGroupId === undefined || challengeGroupId === null) return true;
        return String(challengeGroupId) === String(selectedGroupId);
      });
    }
    return list; 
  }, [list, challengeMode, selectedGroupId]);

  const goToChallengeRequest = () => {
    navigate('/myPage/challengeRequest'); 
  };

  useEffect(() => {
    loadList(challengeMode); 
    loadMyJoined(challengeMode);
    if (challengeMode !== "GROUP") setSelectedGroupId(null);
  }, [challengeMode, user?.userId]);

  useEffect(() => {
    if (challengeMode === "GROUP" && groupBudgetList.length > 0 && !selectedGroupId) {
      const firstId = groupBudgetList[0].groupbId || groupBudgetList[0].group_id;
      if (firstId) setSelectedGroupId(firstId);
    }
  }, [challengeMode, groupBudgetList, selectedGroupId]);

  useEffect(() => {
    if (challengeMode === "GROUP") {
      if (selectedGroupId) loadMyJoined("GROUP"); 
      else setJoinedMap({});
    } else {
      loadMyJoined("PERSONAL");
    }
  }, [challengeMode, selectedGroupId, user?.userId]);

  useEffect(() => {
    if (challengeMode === "GROUP" && selectedGroupId && Object.keys(joinedMap).length > 0) {
      Object.keys(joinedMap).forEach((id) => {
        if (joinedMap[id]?.status === "PROCEEDING") loadRanking(id);
      });
    }
  }, [joinedMap, challengeMode, selectedGroupId]);

  useEffect(() => {
    if (isGroupLoading) return;

    if (challengeMode === "GROUP" && groupBudgetList.length === 0) {
      alert("그룹 챌린지는 그룹 가계부 가입 후 이용 가능합니다.");
      setChallengeMode("PERSONAL");
    }
  }, [challengeMode, groupBudgetList, isGroupLoading]);

  useEffect(()=> {
    if(urlGroupId) {
      setChallengeMode("GROUP");
      setSelectedGroupId(Number(urlGroupId));
    }
  }, [urlGroupId]);

  const pickMessage = (res) => {
    if (res == null) return "참여 완료";
    if (typeof res === "string") return res;
    return res?.message || res?.msg || "참여 완료";
  };

  const pickErrorMessage = (e) => {
    return e?.message || e?.response?.data?.message || "참여 실패";
  };

  const confirmJoin = async () => {
    if (!selected || !user?.userId) return;
    try {
      let res;
      if (challengeMode === "GROUP") {
        res = await challengeApi.joinGroupChallenge({
          userId: user.userId,
          challengeId: selected.challengeId,
          groupbId: selectedGroupId,
          duration: selected.duration,
          startDate: joinForm.startDate + " 00:00:00",
          endDate: joinForm.endDate + " 23:59:59",
        });
      } else {
        res = await challengeApi.join({
          userId: user.userId, challengeId: selected.challengeId,
          startDate: joinForm.startDate, endDate: joinForm.endDate,
        });
      }
      setJoinMsg(pickMessage(res));
      setTimeout(async () => {
        await loadMyJoined(challengeMode); 
        closeJoin();
      }, 1500); 
    } catch (e) {
      setJoinMsg(pickErrorMessage(e));
    }
  };

  const getJoinLabel = (challengeId) => {
    const j = joinedMap[challengeId];
    if (!j) return "참여하기"; 
    switch(j.status) {
      case "SUCCESS": return "성공(완료)";
      case "RESERVED": return "참여 예정";
      case "PROCEEDING": return "진행중";
      case "FAILED": return "참여하기";
      default: return "참여중";
    }
  };

  const isJoined = (challengeId) => {
    const j = joinedMap[challengeId];
    return j && (j.status === "PROCEEDING" || j.status === "RESERVED" || j.status === "SUCCESS");
  };

  const ChallengeGauge = ({ startDate, endDate }) => {
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date().getTime();
    return new Date(dateStr.replace(' ', 'T')).getTime();
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const now = new Date().getTime();

  const total = end - start;
  const elapsed = now - start;
  const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
  const safeProgress = isNaN(progress) ? 0 : progress;

  return (
    <div
      style={{
        height: "25px",
        width: "100%",
        backgroundColor: "#e5e7eb",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${safeProgress}%`,
          backgroundColor: "#10b981",
          borderRadius: "20px",
          transition: "width 0.3s ease"
        }}
      />
    </div>
  );
};





  return (
    <main className="fade-in">
      <div className="content-header">
        <div className="challenge-wrap">
          <div className="challenge-head">
            <h2 className="challenge-title">챌린지</h2>
            <div className="challenge-sub">절약도 즐겁게! 오소리와 함께 챌린지 시작해요.</div>
          </div>
        </div>
      </div>

        {/* <div className="challenge-tab">
          <button className={`challenge-tabBtn ${challengeMode === "PERSONAL" ? "active" : ""}`} onClick={() => setChallengeMode("PERSONAL")}>개인 챌린지</button>
          <button className={`challenge-tabBtn ${challengeMode === "GROUP" ? "active" : ""}`} onClick={() => setChallengeMode("GROUP")}>그룹 챌린지</button>
          <button type="button" className="challenge-tabBtn challenge-history-btn" onClick={openHistory}>지난 챌린지</button>
          <button type="button" className="challenge-tabBtn challenge-history-btn" onClick={goToChallengeRequest}>챌린지 요청하기</button>
        </div> */}

        {/* 탭 영역 */}
        <div className="challenge-tab">
          <div className="challenge-tab-left">
            <button
              className={`challenge-tabBtn ${challengeMode === "PERSONAL" ? "active" : ""}`}
              onClick={() => setChallengeMode("PERSONAL")}
            >
              개인 챌린지
            </button>

            <button
              className={`challenge-tabBtn ${challengeMode === "GROUP" ? "active" : ""}`}
              onClick={() => setChallengeMode("GROUP")}
            >
              그룹 챌린지
            </button>
          </div>
        </div>

        {/* 보조 버튼 영역 */}
        <div className="challenge-sub-actions">
          <button
            type="button"
            className="challenge-ghost-btn"
            onClick={openHistory}
          >
            지난 챌린지
          </button>

          <button
            type="button"
            className="challenge-primary-btn"
            onClick={goToChallengeRequest}
          >
            + 챌린지 요청하기
          </button>
        </div>


        <div className="challenge-body">
          {isLoading && <div className="challenge-empty">불러오는 중...</div>}
          {!isLoading && errorMsg && <div className="challenge-empty">{errorMsg}</div>}
          {!isLoading && !errorMsg && list?.length === 0 && <div className="challenge-empty">챌린지가 없음</div>}

          {challengeMode === "GROUP" && groupBudgetList.length > 0 && (
            <div className="group-selection-area" style={{ marginBottom: "20px", padding: "10px" }}>
              <p style={{ fontSize: "14px", marginBottom: "8px", color: "#666" }}>대상 그룹 가계부 선택:</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {groupBudgetList.map((gb) => (
                  <button key={gb.groupbId} onClick={() => setSelectedGroupId(gb.groupbId)}
                    style={{
                      padding: "6px 12px", borderRadius: "20px", border: "1px solid #ddd",
                      backgroundColor: selectedGroupId === gb.groupbId ? "#2c3e50" : "#fff",
                      color: selectedGroupId === gb.groupbId ? "#fff" : "#333", cursor: "pointer"
                    }}
                  >{gb.title}</button>
                ))}
              </div>
            </div>
          )} 

          {!isLoading && !errorMsg && filteredList?.length > 0 && (
            <div className="challenge-list">
              {filteredList.map((c) => {
                const id = String(c?.challengeId ?? c?.challenge_id);
                const desc = c?.description ?? c?.desc;
                const j = joinedMap[id];
                const prog = progressMap[id];

                return (
                  <article key={id + desc} className={`cp-card ${challengeMode === "GROUP" ? "group-card" : ""}`}>
                    <div className="cp-cardTop">
                      <div className="cp-badge">{fmtMode(challengeMode)}</div>
                      {/* <div className="cp-id">{id}</div> */}
                    </div>
                    
                    {challengeMode === "GROUP" && selectedGroupId && (
                      <p><span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>
                        {/* [ {groupBudgetList.find(g => String(g.groupbId) === String(selectedGroupId))?.title || "선택됨"} ] 대상 */}
                      </span></p>
                    )}

                    <div className="cp-desc">{desc}</div>

                    <div className="cp-meta">
                      <div className="cp-metaRow"><span className="cp-k">카테고리</span><span className="cp-v">{c.category || "전체"}</span></div>
                      <div className="cp-metaRow"><span className="cp-k">구분</span><span className="cp-v">{fmtType(c.type)}</span></div>
                      <div className="cp-metaRow"><span className="cp-k">기간</span><span className="cp-v">{c.duration === 0 ? "전체" : `${c.duration}일`}</span></div>
                      <div className="cp-metaRow"><span className="cp-k">목표</span><span className="cp-v">{c.targetCount ? `${c.targetCount}회 이하` : `${(c.target || 0).toLocaleString()}원 이하`}</span></div>
                    </div>

                    {j?.startDate && j?.endDate && (
                      <div className="cp-date">시작날짜({parseDate(j.startDate)}) ~ 종료날짜({parseDate(j.endDate)})</div>
                    )}

                    {challengeMode === "PERSONAL" && j?.status === "PROCEEDING" && (
                      <div className="cp-live-dashboard" style={{ 
                        marginTop: "15px", 
                        padding: "12px 18px", 
                        background: "#f8f9fa", 
                        borderRadius: "8px", 
                        border: "1px solid #e9ecef", 
                        position: "relative",
                        width: "100%", 
                        boxSizing: "border-box"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "bold", color: "#495057" }}>🏃 실시간 진행 현황</span>
                          <span style={{ fontSize: "11px", color: "#e03131", fontWeight: "bold" }}>⏱ {getTimeLeft(j.endDate)}</span>
                        </div>
                        
                        {prog ? (
                          <>
                            {id === "impulse_control_challenge" ? (
                              <div style={{ padding: "8px 0", borderTop: "1px solid #dee2e6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "14px", color: "#2c3e50" }}>현재 지출 횟수</span>
                                <span style={{ fontSize: "14px", color: "#2c3e50", textAlign: "right" }}>
                                  <strong style={{ color: "#e67e22", fontSize: "16px" }}>{prog.currentValue}</strong> / {prog.targetCount}회
                                </span>
                              </div>
                            ) : (
                              <div style={{ borderTop: "1px solid #dee2e6", paddingTop: "8px" }}>
                                <div style={{ color: "#495057", marginBottom: "8px", fontWeight: "bold", fontSize: "11px" }}>날짜별 내역:</div>
                                {prog.dailyDetails && prog.dailyDetails.length > 0 ? (
                                  prog.dailyDetails.map((day, idx) => (
                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                                      {/* ✅ 날짜 글씨 스타일 수정 (이미지 속 원래 스타일) */}
                                      <span style={{ fontSize: "13px", color: "#64748b" }}>{day.DAY || day.day}</span>
                                      {/* ✅ 금액 글씨 스타일 수정 (이미지 속 원래 스타일) */}
                                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b", textAlign: "right" }}>{Number(Object.values(day).find(v => typeof v === "number")).toLocaleString()}원</span>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ fontSize: "12px", color: "#868e96", textAlign: "center" }}>기록된 지출 없음</div>
                                )}
                              </div>
                            )}
                          </>
                        ) : <div style={{ fontSize: "12px", color: "#adb5bd", textAlign: "center", borderTop: "1px solid #dee2e6", paddingTop: "8px" }}>로딩 중...</div>}
                      </div>
                    )}

                    <div className="cp-actions" style={{ position: "absolute", right: "22px", top: "40%", transform: "translateY(-50%)", zIndex: 2 }}>
                      <button className={`cp-joinBtn ${isJoined(id) ? "disabled" : ""}`} onClick={() => !isJoined(id) && openJoin(c)} disabled={isJoined(id)}>
                        {getJoinLabel(id)}
                      </button>
                    </div>

                    {j?.status === "PROCEEDING" && id === "group_reduceZero_competition" && (
                      <div className="cp-ranking-section" style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8fbff", borderRadius: "10px", border: "1px solid #e1e9f5" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "bold", color: "#2c3e50" }}>🏆 실시간 그룹 순위</span>
                          <button onClick={() => loadRanking(id)} style={{ fontSize: "11px", color: "#4A90E2", background: "none", border: "none", cursor: "pointer" }}>↻</button>
                        </div>
                        {rankings[id]?.slice(0, 3).map((rk, idx) => (
                          <div key={rk.userId} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", marginBottom: "4px", background: "#fff", borderRadius: "8px", border: "1px solid #eee" }}>
                            <span style={{ fontSize: "13px" }}>{idx + 1}위. {rk.nickname}</span>
                            <span style={{ fontSize: "13px", fontWeight: "bold" }}>{Number(rk.totalAmount).toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {j?.status === "PROCEEDING" && id === "group_zero_challenge" && (
                      <div style={{ marginTop: '10px' }}>
                        {/* DB 데이터를 props로 전달 */}
                        <ChallengeGauge startDate={j.startDate} endDate={j.endDate} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginTop: '4px' }}>
                          <span>시작일: {new Date(j.startDate).toLocaleString()}</span>
                          <span>종료일: {new Date(j.endDate).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {j?.status === "RESERVED" && id === "group_zero_challenge" && (
                      <div style={{
                        marginTop: "10px",
                        padding: "8px",
                        background: "#fff3cd",
                        border: "1px solid #ffeeba",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#856404"
                      }}>
                        🕛 {new Date(j.startDate).toLocaleString()} 부터 시작됩니다.
                      </div>
                    )}

                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* 참여 모달 */}
        {isJoinOpen && selected && (
          <div className="ch-modalOverlay" onClick={closeJoin}>
            <div className="ch-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ch-modalTitle">챌린지 참여</div>
              <div className="ch-modalDesc">
                <div className="ch-modalDescStrong">{selected?.description}</div>
                <div className="ch-modalDescSub">기간 {selected?.duration}일</div>
              </div>
              <div className="ch-form">
                <div className="ch-field">
                  <label>시작일</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={joinForm.startDate} 
                    // challengeMode가 GROUP이면 읽기 전용으로 설정
                    readOnly={challengeMode === "GROUP"}
                    onChange={(e) => {
                      // GROUP 모드일 때는 변경 로직이 실행되지 않도록 방어
                      if (challengeMode === "GROUP") return;

                      const v = e.target.value;
                      setJoinForm(prev => ({ 
                        ...prev, 
                        startDate: v, 
                        endDate: calcEndDate(v, selected?.duration || 1, challengeMode) 
                      }));
                    }} 
                  />
                </div>
                <div className="ch-field"><label>종료일</label><input type="date" value={joinForm.endDate} readOnly /></div>
              </div>
              {joinMsg && <div className="ch-msg">{joinMsg}</div>}
              <div className="ch-actions">
                <button className="ch-btn ghost" onClick={closeJoin}>취소</button>
                <button className="ch-btn primary" onClick={confirmJoin}>참여 확정</button>
              </div>
            </div>
          </div>
        )}

        {/* 지난 챌린지 모달 */}
        {isHistoryOpen && (
          <div className="ch-modalOverlay" onClick={closeHistory}>
            <div className="ch-modal ch-modal--history" onClick={(e) => e.stopPropagation()}>
              <div className="ch-modalTitle">지난 챌린지</div>
              {historyMsg && <div className="ch-msg">{historyMsg}</div>}
              {!historyMsg && historyList.length === 0 && <div className="challenge-empty">기록 없음</div>}
              <div className="ch-historyList">
                {historyList.map((h, idx) => (
                  <div key={idx} className="ch-historyItem">
                    <div className="ch-historyTop">
                      <div className="ch-historyTitle">{h?.description}</div>
                      <div className={`ch-historyStatus ${h?.status === "SUCCESS" ? "success" : "failed"}`}>{h?.status === "SUCCESS" ? "성공" : "실패"}</div>
                    </div>
                    <div className="ch-historyMeta">
                      <div>카테고리: {h?.category || "전체"}</div>
                      <div>목표: {h?.targetCount ? `${h.targetCount}회` : `${(h?.target || 0).toLocaleString()}원`} 이하</div>
                    </div>
                    <div className="ch-historyDate">기간: {parseDate(h?.startDate)} ~ {parseDate(h?.endDate)}</div>
                  </div>
                ))}
              </div>
              <div className="ch-actions"><button className="ch-btn primary" onClick={closeHistory}>닫기</button></div>
            </div>
          </div>
        )}
      
    </main>
  );

}  
   




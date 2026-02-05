import React, { useEffect, useState, useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import { groupBudgetApi } from "../../../api/groupBudgetApi";
import AddGroupBudgetModal from "../../group/AddGroupBudgetModal";
import useAlarmSocket from "../../alarm/useAlarmSocket";
import ZScoreNotification from "../../Util/ZScoreNotification";
import transApi from "../../../api/transApi";
import OldGroupBudgetModal from "../../group/OldGroupBudgetModal";
import { useGroupBudgets } from "../../../hooks/useGroupBudgets";

const MyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.nickName || user?.nickname || user?.userName || "회원";
  const email = user?.email || "";

  const [isLoading,setIsLoading] = useState(true); 
  const [isModalOpen,setIsModalOpen] =useState(false); //새로운 그룹가계부 생성 모달
  const [isModalOpen2, setIsModalOpen2] = useState(false); //이전 가계부 목록 모달
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const { notifications, setNotifications } = useAlarmSocket(user?.loginId);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const { groupBudgetList = [], isLoading: isGroupLoading, fetchGroupBudgetList } = useGroupBudgets(user?.userId);
  const serverAvatarUrl = user?.changeName 
    ? `http://localhost:8080/osori/upload/profiles/${user.changeName}` 
    : "";

  //안읽은 알림 목록 조회
  const fetchNotiList = async(loginId)=>{
    setIsLoading(true);
    try{
      const data = await groupBudgetApi.notiList(loginId);

      setNotifications([...data].reverse());
    }catch(error){
      console.error('안읽은 알림 목록 조회 실패',error);
    }finally{
      setIsLoading(false);
    }
  }

  //내 가계부 지출액 표시 함수
  const loadData = async () => {
      setIsLoading(true);
      try {
        if (user?.userId) {
          const transData = await transApi.getUserTrans(user.userId); 
          setTransactions(transData);
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
  
    // MyPage.jsx 내부에 추가
    const totalMonthlyExpenditure = useMemo(() => {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
  
      return transactions
        .filter((t) => {
          // 날짜 파싱 (26/01/28 또는 2026-01-28 대응)
          const dateStr = t.date || t.transDate;
          if (!dateStr) return false;
          
          const parts = dateStr.split(/[/.-]/);
          let year, month;
          
          if (parts.length === 3) {
            year = parseInt(parts[0]);
            if (year < 100) year += 2000; // 26 -> 2026 변환
            month = parseInt(parts[1]) - 1;
          } else {
            const d = new Date(dateStr);
            year = d.getFullYear();
            month = d.getMonth();
          }
  
          // 이번 달 지출(OUT)만 필터링
          return (
            year === currentYear &&
            month === currentMonth &&
            t.type?.toUpperCase() === 'OUT'
          );
        })
        .reduce((sum, t) => sum + Math.abs(t.amount || t.originalAmount || 0), 0);
    }, [transactions, currentDate]);

  useEffect(()=>{
    navigate('/mypage');
    loadData();
  },[user?.userId, navigate]);

  useEffect(()=>{
    fetchNotiList(user?.loginId);
  },[]);

  // 수락/거절 처리 함수
  const handleInviteAction = async (noti, status) => {
    try {
      const params = {
        status: status, // "ACCEPTED" / "REJECTED"
        inviteNum: noti.inviteNum, // 그룹 가계부 ID
        receiver: user?.userId    // 현재 사용자 ID
      };

      const response = await groupBudgetApi.updateNotiStatus(params);
      if (response === 200) {
        alert(status === "ACCEPTED" ? "초대를 수락했습니다." : "초대를 거절했습니다.");
        
        // 3. 처리가 완료된 알림을 화면에서 제거
        setNotifications(prev => {
          if (!prev) return []; // 방어 코드
          return prev.filter(n => n.notiId !== noti.notiId);
        });
        
        await groupBudgetApi.updateNotiIsRead(noti.notiId);
        
        // 수락했을 경우 그룹 가계부 목록을 새로고침
        if (status === "ACCEPTED") {
          fetchGroupBudgetList();
        }
      }
    } catch (error) {
      console.error("초대 상태 변경 실패", error);
      alert("처리에 실패했습니다.");
    }
  };

  const handleNotiRead = async (noti) =>{
    try {
      await groupBudgetApi.updateNotiIsRead(noti.notiId);

      setNotifications(prev => {
        if (!prev) return []; 
        return prev.filter(n => n.notiId !== noti.notiId);
      });
        
    } catch (error) {
      console.error("알림 읽음 상태 변경 실패", error);
    }
  }


  return (
    <main className="fade-in">
      <header className="content-header">
        <h2>마이페이지</h2>

        <p className="welcome-text">{displayName} 님 환영합니다.</p>

          <div className="content-header2">
            <div className="alarm-wrapper" onClick={() => setIsNotiOpen(!isNotiOpen)} style={{ cursor: 'pointer', position: 'relative' }}>
              <img className="alarm" src="https://img.icons8.com/?size=100&id=82779&format=png&color=000000"/>
              {notifications.length > 0 && <span className="unread"></span>}
            </div>
          </div>

        {/* 실시간 알림 목록 드롭다운 */}
          {isNotiOpen && (
            <div className="noti-dropdown">
              <h4 style={{textAlign:"center",marginBottom:"0"}}>알림 목록</h4>
              {notifications.length === 0 ? (
                <p className="empty-msg">새로운 알림이 없습니다.</p>
              ) : (
                <ul className="sidebar-menu">
                  {notifications.map((noti) => (
                    <li key={noti.notiId} className="noti-item">
                      <p className="noti-text">{noti.message}</p>
                      
                      {/* 알림 타입이 'INVITE'일 때만 수락/거절 버튼 노출 */}
                      {noti.ntype === 'INVITE' ? (
                        <div className="noti-btns">
                          <button className="accept-btn" onClick={() => handleInviteAction(noti, "ACCEPTED")}>수락</button>
                          <button className="reject-btn" onClick={() => handleInviteAction(noti, "REJECTED")}>거절</button>
                        </div>
                      ) : (
                        <div className="noti-btns">
                          <button className="accept-btn" onClick={() => handleNotiRead(noti)}>읽음</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
      </header>

      <section className="profile-fixed-card">
        <div className="info-card profile-main">
          <div className="profile-section">
              <div className="profile-img ps-avatar">
                {serverAvatarUrl ? (
                  <img src={serverAvatarUrl} alt="프로필" />
                ) : (
                  <span aria-hidden>👤</span>
                )}
              </div>
            <div className="profile-details">
              <h3>{displayName}</h3>
              <p>{email}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="account-book-grid">
        <div className="info-card"
          onClick={() =>navigate("/mypage/myAccountBook")} 
          style={{ cursor: "pointer"}}
        >
          <div className="card-title-area">
            <h3>🏠 내 가계부</h3>
          </div>
          <div className="account-detail">
            <p className="amount-title"  style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>이번 달 지출 </p>
            <p className="amount" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{totalMonthlyExpenditure.toLocaleString()}원</p>
            
            <ZScoreNotification transactions={transactions} currentDate={currentDate}/>
          </div>
        </div>

        <div className="info-card" ><br/>  {/*높이 조정 임시 br 추가*/}
          <div className="card-title-area">
            <h3>👨‍👩‍👧‍👦 그룹 가계부</h3>
            <span className="status-dot">{groupBudgetList.length}개 운영 중</span>
          </div>
          <div className="account-detail">
            <ul className="sidebar-menu">
              {groupBudgetList.length === 0 &&
                <li style={{paddingBottom:'20px'}}>
                  관리중인 그룹 가계부가 없습니다.
                </li>
              }

              {groupBudgetList &&
                groupBudgetList.map((gb)=>(
                  <li key={gb.groupbId}>
                    <NavLink
                      to={{
                            pathname: "/mypage/groupAccountBook",
                            search: `?groupId=${gb?.groupbId}`,
                          }}
                      className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                    >
                      <span>🪙{gb.title} 가계부</span> 
                      ({gb.startDate}~{gb.endDate})
                    </NavLink>
                  </li>
                ))
              }
            </ul>
            
            

            {isModalOpen && (
              <AddGroupBudgetModal 
                userId={user?.userId} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => {
                  setIsModalOpen(false);
                  fetchGroupBudgetList(); //목록 새로고침
                }}
              />
            )}

            {isModalOpen2 && (
              <OldGroupBudgetModal 
                userId={user?.userId} 
                onClose={() => setIsModalOpen2(false)} 
                onSuccess={() => {
                  setIsModalOpen2(false);
                }}
              />
            )}
          </div>
          <div className="buttons-wrapper">
              <button 
                  onClick={() => setIsModalOpen(true)}
                  className="menu-item btn"
              >
              새로운 가계부 만들기
              </button>
              <button 
                  onClick={() => setIsModalOpen2(true)}
                  className="menu-item btn"
              >
              이전 가계부
              </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPage;
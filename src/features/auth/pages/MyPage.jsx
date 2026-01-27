import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import { groupBudgetApi } from "../../../api/groupBudgetApi";
import AddGroupBudgetModal from "../../group/AddGroupBudgetModal";

const MyPage = () => {
  const { user } = useAuth();

  const displayName = user?.nickName || user?.nickname || user?.userName || "회원";
  const email = user?.email || "";

  const [groupBudgetList,setGroupBudgetList] =useState([]);
  const [isLoading,setIsLoading] = useState(true);
  const [isModalOpen,setIsModalOpen] =useState(false);
  const navigate = useNavigate();

  const fetchGroupBudgetList = async()=>{
      setIsLoading(true);
      try{
        const data = await groupBudgetApi.groupBudgetList(user?.userId);
        setGroupBudgetList(data);
      }catch(error){
        if(setGroupBudgetList.length !== 0){
          console.error('그룹가계부 목록 조회 실패',error);
          alert('그룹가계부 목록을 조회할 수 없습니다.');
          navigate('/mypage');
        }
      }finally{
        setIsLoading(false);
      }
    }

  useEffect(()=>{
    fetchGroupBudgetList();
  },[navigate]);


  return (
    <main className="fade-in">
      <header className="content-header">
        <h2>마이페이지</h2>
        <p className="welcome-text">{displayName} 님 환영합니다.</p>
      </header>

      <section className="profile-fixed-card">
        <div className="info-card profile-main">
          <div className="profile-section">
            <div className="profile-img">👤</div>
            <div className="profile-details">
              <h3>{displayName}</h3>
              <p>{email}</p>
            </div>
          </div>
          <div className="alarm" style={{ border: "3px solid lightgray" }}>🔔</div>
        </div>
      </section>

      <div className="account-book-grid">
        <div className="info-card"
          onClick={() =>navigate("/mypage/myAccountBook")} 
          style={{ cursor: "pointer" }}
        >
          <div className="card-title-area">
            <h3>🏠 내 가계부</h3>
          </div>
          <div className="account-detail">
            <p className="amount">예산: 3,420,000원</p>
            <p className="desc">지금까지 지출: 850,000원</p>
          </div>
        </div>

        <div className="info-card">
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
                            pathname: "/mypage/groupBudget",
                            search: `?groupId=${gb?.groupbId}`,
                          }}
                      className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                    >
                      <span>🪙</span> {gb.title} 가계부
                      ({gb.startDate}~{gb.endDate})
                    </NavLink>
                  </li>
                ))
              }
            </ul>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="alarm"
            >
             새로운 가계부 만들기
            </button>

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
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPage;
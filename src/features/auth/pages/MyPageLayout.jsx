
import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import { useState,useRef } from "react";
import { faqApi } from "../../../api/faqApi";
import { useSpendingAnalytics } from "../../../hooks/useSpendingAnalysis";
import transApi from "../../../api/transApi";

const MyPageLayout = ({refreshGroupList}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const scrollRef = useRef();
  const [isFaqModalOpen,setIsFaqModalOpen] =useState(false);
  const [faqList, setFaqList] = useState([]);
  const [newQuestion,setNewQuestion] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      message: '반가워요! 😊 똑똑한 돈 관리, 무엇부터 도와드릴까요?'
    }
  ]);

  const fetchTransactions = () => {
    const userId = user?.userId || user?.USER_ID || user?.id || 1;

    transApi.getUserTrans(userId)
      .then(data => {
        if (!data || !Array.isArray(data)) {
            setTransactions([]);
            return;
        }
        const mappedData = data.map(item => {
          const rawDate = item.transDate || item.TRANS_DATE || "";
          let formattedDate = rawDate;
          if (rawDate && typeof rawDate === 'string' && rawDate.includes('/')) {
              const [yy, mm, dd] = rawDate.split('/');
              formattedDate = `20${yy}-${mm}-${dd}`;
          }

          return {
              id: item.transId || item.TRAN_ID || item.trans_id || item.id || 0,
              text: item.title || item.TITLE,
              amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || 0),
              date: formattedDate,
              type: item.type || item.TYPE,
              category: item.category || item.CATEGORY || '기타',
              memo: item.memo || item.MEMO || '',
              isShared: item.isShared || item.IS_SHARED || 'N'
          };
        });
        setTransactions(mappedData);
      })
      .catch(error => console.error("데이터 로드 실패:", error));
  };
  
  useEffect(() => {
      fetchTransactions();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  //faq 리스트 불러오기
  const fetchFaqList = async()=>{
      try{
        const data = await faqApi.faqList();

        setFaqList(data);
      }catch(error){
        console.error('FAQ 질문 목록 조회 실패',error);
        navigate('/mypage');    
      }
  }

  useEffect(() => {
  if (isFaqModalOpen) {
    fetchFaqList();
    setMessages([{
      id: 'welcome',
      type: 'bot',
      message: '반가워요! 😊 똑똑한 돈 관리, 무엇부터 도와드릴까요?'
    }]);
  }
}, [isFaqModalOpen]);

  const handleQuestionClick = (faqId) => {
    // 해당 질문과 답변 데이터
    const selectedFaq = faqList.find(item => item.faqId === faqId);
    
    if (!selectedFaq) return;

    const userMsg = { id: Date.now(), type: 'user', message: selectedFaq.question };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, type: 'bot', message: selectedFaq.answer };
      setMessages(prev => [...prev, botMsg]);
    }, 600); // 0.6초 뒤에 답변 등장
  };

  // const handleNewQuestioSubmit = async() => {
  //   try{
  //     const response = await faqApi.addNewQuestion(newQuestion);
  //     console.log(response);

  //     alert("질문이 성공적으로 저장되었습니다.");
  //     setIsInputVisible(false);
  //   }catch(error){
  //     console.log("질문 등록 오류 발생",error);
  //     alert("질문 등록중에 오류가 발생했습니다. 다시 시도해 주세요.");
  //   }
  //   setNewQuestion('');
  // };

  const analytics = useSpendingAnalytics(transactions, new Date());

  const handleChatSubmit = async() =>{
    if(!newQuestion.trim()) return;

    //회원 메시지 추가
    const userMsg = {id: Date.now(), type:'user', message: newQuestion};
    setMessages(prev => [...prev,userMsg]);

    const currentQuestion = newQuestion;
    setNewQuestion('');
    setIsInputVisible(false);

    //로딩중
    const botId= Date.now() + 1;
    setMessages(prev => [...prev, {id:botId, type:'bot',message:'OSORI가 답변을 생성중입니다...'}]);

    try{
      const payload = {
          question: currentQuestion, // 서버 컨트롤러의 @RequestBody 키값과 맞춰야 함
          analysisContext: analytics ? {
              currentPredict: analytics.projectedCurrent,
              nextPredict: analytics.predictedAmount,
              avg: analytics.averageValue,
              status: analytics.availableDataPoints < 2 ? "데이터 부족" : "분석 완료"
          } : null
      };

      const response = await faqApi.askAi(payload);

      setMessages(prev => prev.map(msg =>
        msg.id === botId ? {...msg, message: response.answer} : msg
      ));
    } catch(error){
      console.error("AI 응답 에러:", error);
      setMessages(prev => prev.map(msg =>
        msg.id === botId ? {...msg,message:"죄송합니다. 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."} : msg
      ));
    }
  };


  return (
    <div className="mypage-container">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer", padding: "0 20px 30px" }}>
          OSORI
        </div>

        <ul className="sidebar-menu">
          <li>
            <NavLink to="/mypage/assets" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>💰</span> 자산관리
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/calendarView" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>📅</span> 캘린더뷰
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mypage/fixedTrans"
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
            >
              <span>📌</span> 고정지출
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/challenge" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>🎯</span> 챌린지
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/myBadges" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>🏆</span> 내 뱃지
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/profileSettings" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <span>⚙️</span> 프로필 설정
            </NavLink>
          </li>

        </ul>

        <div className="faq-container">
          {isFaqModalOpen && (
            <div className="faq-dropdown">
              <h4 style={{ textAlign: "center", marginBottom: "15px" }}>FAQ</h4>
              
              {/* 채팅 영역 */}
              <div className="faq-chat-area" ref={scrollRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-row ${msg.type}`}>
                    <div className="chat-bubble">
                      {msg.message}
                    </div>
                  </div>
                ))}

                {/* 질문 선택 버튼 영역 */}
                {messages[messages.length - 1]?.type === 'bot' && (
                  <div className="question-list-area">
                    {faqList.length === 0 ? (
                      <p className="empty-msg">등록되어 있는 FAQ가 없습니다.</p>
                    ) : (
                      faqList.map((faq) => (
                        <button 
                          key={faq.faqId} 
                          className="faq-item-btn"
                          onClick={() => handleQuestionClick(faq.faqId)}
                        >
                          {faq.question}
                        </button>
                      ))
                    )}
                    {!isInputVisible ? (
                      <button 
                          className="faq-item-btn"
                          onClick={() => setIsInputVisible(true)}
                      >
                          새로운 질문을 등록해주세요.
                      </button>
                    ) : (
                        <div className="new-question-input-area">
                            <input 
                                type="text"
                                id="question"
                                name="question"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="질문을 입력하세요."
                            />
                            <button onClick={handleChatSubmit}>등록</button>
                            <button onClick={() => setIsInputVisible(false)}>취소</button>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <img className="qBot" 
            src="https://img.icons8.com/?size=100&id=f6ABPUNqMjFa&format=png&color=0066ff" 
            alt="질문봇 이미지"
            onClick={() => setIsFaqModalOpen(!isFaqModalOpen)}
          />
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </aside>

      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;

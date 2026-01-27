import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './CalendarView.css'; 

function CalendarView({ currentDate, setCurrentDate }) {
  const { user } = useAuth();
  const [ledgers, setLedgers] = useState([]); // 가계부 목록 (개인 + 그룹)
  const [transactions, setTransactions] = useState([]); // 전체 거래 내역
  const [activeLedgers, setActiveLedgers] = useState(['personal']); // 현재 활성화된 필터
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  const userId = user?.userId || 3; 

  // 1. 가계부 목록 로드 (개인 가계부 + 참여 중인 그룹 가계부)
  useEffect(() => {
    axios.get('http://localhost:8080/osori/group/gbList', { params: { userId } })
      .then(res => {
        const personal = { id: 'personal', name: '내 가계부', color: '#0066ff' };
        const groups = res.data.map((gb, idx) => ({
          id: String(gb.groupbId || gb.GROUPB_ID), 
          name: gb.title || gb.TITLE,
          color: ['#ff9f43', '#ee5253', '#10ac84', '#5f27cd'][idx % 4]
        }));

        const combined = [personal, ...groups];
        setLedgers(combined);
        setActiveLedgers(combined.map(l => l.id)); // 초기값: 전체 선택
      })
      .catch(() => setLedgers([{ id: 'personal', name: '내 가계부', color: '#0066ff' }]));
  }, [userId]);

  // 2. 모든 활성화된 가계부의 내역을 서버에서 가져오기
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const pReq = axios.get(`/osori/trans/user/${userId}`);
        const groupIds = ledgers.filter(l => l.id !== 'personal').map(l => l.id);
        const gReqs = groupIds.map(id => axios.get('/osori/group/gbTrans', { params: { groupbId: id } }));

        const [pRes, ...gRes] = await Promise.all([pReq, ...gReqs]);

        const pData = pRes.data.map(t => ({ ...t, ledgerId: 'personal', date: t.transDate || t.date }));
        const gData = gRes.flatMap((res, idx) => 
          res.data.map(t => ({ ...t, ledgerId: groupIds[idx], date: t.transDate }))
        );

        setTransactions([...pData, ...gData]);
      } catch (err) {
        console.error("내역 로드 실패:", err);
      }
    };

    if (ledgers.length > 0) fetchAllData();
  }, [ledgers, userId]);

  // 3. 필터링 및 전체 토글 로직
  const isAllActive = ledgers.length > 0 && activeLedgers.length === ledgers.length;

  const toggleAll = () => {
    if (isAllActive) {
      setActiveLedgers([]); // 전체 해제
    } else {
      setActiveLedgers(ledgers.map(l => l.id)); // 전체 선택
    }
  };

  const toggleLedger = (id) => {
    setActiveLedgers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  // 현재 필터링된 데이터 계산
  const filteredData = useMemo(() => {
    return transactions.filter(item => activeLedgers.includes(String(item.ledgerId)));
  }, [transactions, activeLedgers]);

  const details = useMemo(() => {
    if (!selectedDate) return [];
    return filteredData.filter(item => item.date === selectedDate);
  }, [filteredData, selectedDate]);

  // 4. 달력 날짜 칸에 금액 표시
  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA');
      const dayData = filteredData.filter(item => item.date === dateStr);
      
      if (dayData.length > 0) {
        const income = dayData.filter(i => i.type === 'IN').reduce((s, i) => s + (i.originalAmount || i.amount), 0);
        const expense = dayData.filter(i => i.type === 'OUT').reduce((s, i) => s + (i.originalAmount || i.amount), 0);
        
        return (
          <div className="amount-container">
            {income > 0 && <div className="income-tag">+{income.toLocaleString()}</div>}
            {expense > 0 && <div className="expense-tag">-{expense.toLocaleString()}</div>}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <main className="fade-in">
      <div className="calendar-page-container">
        {/* 상단 통합 필터 바: 전체 토글 기능 추가 */}
        <div className="ledger-filter-bar">
          <label className={`filter-chip all-filter ${isAllActive ? 'active' : ''}`}>
            <input type="checkbox" checked={isAllActive} onChange={toggleAll} />
            <span className="chip-name">전체 {isAllActive ? '끄기' : '켜기'}</span>
          </label>
          <div className="divider"></div>
          {ledgers.map(l => (
            <label key={l.id} className={`filter-chip ${activeLedgers.includes(l.id) ? 'active' : ''}`}>
              <input type="checkbox" checked={activeLedgers.includes(l.id)} onChange={() => toggleLedger(l.id)}/>
              <span className="dot" style={{ backgroundColor: l.color }}></span>
              <span className="chip-name">{l.name}</span>
            </label>
          ))}
        </div>

        <div className="calendar-content-wrapper" style={{ display: 'flex', gap: '20px' }}>
          {/* 왼쪽: 달력 카드 */}
          <div className="calendar-card" style={{ flex: 7 }}>
            <h2 className="calendar-header">📅 {user?.nickName || '회원'}님의 소비 달력</h2>
            <Calendar 
              onClickDay={(date) => setSelectedDate(date.toLocaleDateString('en-CA'))} 
              tileContent={renderTileContent}
              formatDay={(locale, date) => date.getDate()}
              calendarType="gregory" 
              activeStartDate={currentDate}
              onActiveStartDateChange={({activeStartDate}) => setCurrentDate(activeStartDate)}
            />
          </div>

          {/* 오른쪽: 상세 내역 카드 (배지 및 레이아웃 복구) */}
          <div className="detail-card" style={{ flex : 3 }}>
            <h3 className="detail-title">
              {selectedDate ? `${selectedDate} 내역` : '날짜를 선택하세요'}
            </h3>
            
            <div className="detail-list-container">
              {details.length > 0 ? (
                <ul className="detail-list">
                  {details.map((item, idx) => {
                    // 현재 아이템에 맞는 가계부 정보 찾기
                    const ledgerInfo = ledgers.find(l => l.id === String(item.ledgerId));
                    return (
                      <li key={idx} className="detail-item">
                        <div className="item-info">
                          <div className="item-header">
                            <span className="ledger-badge" style={{ backgroundColor: ledgerInfo?.color }}>
                              {ledgerInfo?.name}
                            </span>
                            {item.nickname && (
                              <span className="item-nickname">[{item.nickname}]</span>
                            )}
                            <span className="item-category">{item.category}</span>
                          </div>
                          <div className="item-body">
                            <span className="item-store">{item.title}</span>
                            {item.memo && <span className="item-memo">{item.memo}</span>}
                          </div>
                        </div>
                        <span className={`item-amount ${item.type}`}>
                          {item.type === 'IN' ? '+' : '-'}{(item.originalAmount || item.amount).toLocaleString()}원
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="no-data-msg">
                  {selectedDate ? '거래 내역이 없습니다.' : '달력에서 날짜를 클릭해 보세요!'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CalendarView;
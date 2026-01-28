import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './CalendarView.css'; 

function CalendarView({ currentDate, setCurrentDate }) {
  const { user } = useAuth();
  const [ledgers, setLedgers] = useState([]); 
  const [transactions, setTransactions] = useState([]); 
  const [activeLedgers, setActiveLedgers] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  const userId = user?.userId || 3; 

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    const cleanStr = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
    const parts = cleanStr.split(/[/|-]/);
    if (parts.length === 3) {
      let [y, m, d] = parts;
      if (y.length === 2) y = "20" + y;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return cleanStr;
  };

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
        setActiveLedgers(combined.map(l => l.id));
      })
      .catch(() => setLedgers([{ id: 'personal', name: '내 가계부', color: '#0066ff' }]));
  }, [userId]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const pReq = axios.get(`/osori/trans/user/${userId}`);
        const groupIds = ledgers.filter(l => l.id !== 'personal').map(l => l.id);
        const gReqs = groupIds.map(id => axios.get('/osori/group/gbTrans', { params: { groupbId: id } }));

        const [pRes, ...gRes] = await Promise.all([pReq, ...gReqs]);

        const pData = pRes.data.map(t => ({ 
          ledgerId: 'personal',
          date: normalizeDate(t.transDate || t.TRANS_DATE || t.date || t.DATE),
          title: t.title || t.TITLE || '내역 없음',
          category: t.category || t.CATEGORY || '기타',
          type: (t.type || t.TYPE || 'OUT').toUpperCase(),
          amount: Number(t.amount || t.originalAmount || t.ORIGINAL_AMOUNT || 0),
          memo: t.memo || t.MEMO || ''
        }));
        
        const gData = gRes.flatMap((res, idx) => 
          res.data.map(t => ({ 
            ledgerId: String(groupIds[idx]), 
            date: normalizeDate(t.transDate || t.TRANS_DATE),
            title: t.title || t.TITLE || '그룹 내역',
            category: t.category || t.CATEGORY || '공동 지출',
            type: (t.type || t.TYPE || 'OUT').toUpperCase(),
            amount: Number(t.originalAmount || t.ORIGINAL_AMOUNT || t.amount || 0),
            memo: t.memo || t.MEMO || '',
            nickname: t.nickname || t.NICKNAME || ''
          }))
        );

        setTransactions([...pData, ...gData]);
      } catch (err) { console.error("데이터 로드 실패:", err); }
    };
    if (ledgers.length > 0) fetchAllData();
  }, [ledgers, userId]);

  const isAllActive = ledgers.length > 0 && activeLedgers.length === ledgers.length;
  const toggleAll = () => setActiveLedgers(isAllActive ? [] : ledgers.map(l => l.id));
  const toggleLedger = (id) => setActiveLedgers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const filteredData = useMemo(() => {
    return transactions.filter(item => activeLedgers.includes(String(item.ledgerId)));
  }, [transactions, activeLedgers]);

  const details = useMemo(() => {
    if (!selectedDate) return [];
    return filteredData.filter(item => item.date === selectedDate);
  }, [filteredData, selectedDate]);

  const monthlyTotalExpense = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return filteredData
      .filter(item => {
        const itemDate = new Date(item.date);
        return item.type === 'OUT' && 
               itemDate.getFullYear() === year && 
               itemDate.getMonth() === month;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  }, [filteredData, currentDate]);

  const renderTileContent = ({ date, view }) => {
    if (view === 'month' && date instanceof Date) {
      const dateStr = date.toLocaleDateString('en-CA');
      const dayData = filteredData.filter(item => item.date === dateStr);
      if (dayData.length > 0) {
        const income = dayData.filter(i => i.type === 'IN').reduce((s, i) => s + i.amount, 0);
        const expense = dayData.filter(i => i.type === 'OUT').reduce((s, i) => s + i.amount, 0);
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
    <div className="calendar-page-container">
      <div className="ledger-filter-bar" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <label className="filter-chip">
          <input type="checkbox" checked={isAllActive} onChange={toggleAll} />
          <span>전체 {isAllActive ? '해제' : '선택'}</span>
        </label>
        <div className="divider" style={{ width: '1px', background: '#ddd', margin: '0 10px' }}></div>
        {ledgers.map(l => (
          <label key={l.id} className="filter-chip">
            <input type="checkbox" checked={activeLedgers.includes(l.id)} onChange={() => toggleLedger(l.id)} />
            <span className="dot" style={{ backgroundColor: l.color, display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', margin: '0 5px' }}></span>
            <span>{l.name}</span>
          </label>
        ))}
      </div>

      <div className="calendar-content-wrapper" style={{ display: 'flex', gap: '20px' }}>
        <div className="calendar-card" style={{ flex: 7 }}>
          <h2 className="calendar-header">📅 {user?.nickName ||'회원'}님의 소비 달력</h2>
          <Calendar 
            onClickDay={(date) => setSelectedDate(date.toLocaleDateString('en-CA'))} 
            tileContent={renderTileContent}
            formatDay={(locale, date) => date.getDate()}
            activeStartDate={currentDate}
            onActiveStartDateChange={({activeStartDate}) => setCurrentDate(activeStartDate)}
          />

          <div className="monthly-summary" style={{
              textAlign: 'right',
              marginTop: '15px',
              paddingRight: '10px',
              fontSize: '1.1rem',
              color: '#333'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#888', marginRight: '5px' }}>
                {currentDate.getMonth() + 1}월 총 지출:
              </span>
              <strong style={{ color: '#e74c3c', fontSize: '1.3rem' }}>
                {monthlyTotalExpense.toLocaleString()}
              </strong>원
            </div>
        </div>




        <div className="detail-card" style={{ flex: 3 }}>
          <h3 className="detail-title">{selectedDate} 내역</h3>
          <div className="detail-list-container">
            {details.length > 0 ? (
              <ul className="detail-list" style={{ listStyle: 'none', padding: 0 }}>
                {details.map((item, idx) => {
                  const ledger = ledgers.find(l => String(l.id) === String(item.ledgerId));
                  return (
                    <li key={idx} className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                      <div>
                        <span className="ledger-badge" style={{ backgroundColor: ledger?.color, color: '#fff', padding: '2px 5px', borderRadius: '4px', fontSize: '12px' }}>{ledger?.name}</span>
                        <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{item.category} {item.nickname && `| ${item.nickname}`}</div>
                      </div>
                      <div className={`item-amount ${item.type}`} style={{ color: item.type === 'IN' ? 'green' : 'red' }}>
                        {item.type === 'IN' ? '+' : '-'}{item.amount.toLocaleString()}원
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>거래 내역이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
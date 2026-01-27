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
  const [activeLedgers, setActiveLedgers] = useState(['personal']);
  const [selectedDate, setSelectedDate] = useState(null);

  const userId = user?.userId || 1;

  useEffect(() => {
    axios.get(`/osori/group/user/${userId}`) //
      .then(res => {
        const personal = { id: 'personal', name: '내 가계부', color: '#0066ff' };
        const groups = res.data.map((g, idx) => ({
          id: String(g.groupbId),
          name: g.title,
          color: ['#ff9f43', '#ee5253', '#10ac84', '#5f27cd'][idx % 4]
        }));
        const combined = [personal, ...groups];
        setLedgers(combined);
        setActiveLedgers(combined.map(l => l.id));
      })
      .catch(err => console.error("그룹 목록 로드 실패:", err));
  }, [userId]);

  useEffect(() => {
    axios.get(`/osori/trans/user/${userId}`)
      .then(res => setTransactions(res.data))
      .catch(err => console.error(err));
  }, [userId]);


  const isAllSelected = activeLedgers.length === ledgers.length;

  const toggleAll = () => {
    setActiveLedgers(isAllSelected ? [] : ledgers.map(l => l.id));
  };

  const toggleLedger = (id) => {
    setActiveLedgers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const filteredData = useMemo(() => {
    return transactions.filter(item => {
      const ledgerId = item.groupbId ? String(item.groupbId) : 'personal';
      return activeLedgers.includes(ledgerId);
    });
  }, [transactions, activeLedgers]);

  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const dayData = filteredData.filter(item => item.transDate === dateString);
      
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
        <div className="ledger-filter-bar">
          <label className="filter-chip all-filter">
            <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
            <span className="chip-name">전체</span>
          </label>
          <div className="divider"></div>
          {ledgers.map(l => (
            <label key={l.id} className="filter-chip">
              <input type="checkbox" checked={activeLedgers.includes(l.id)} onChange={() => toggleLedger(l.id)} />
              <span className="dot" style={{ backgroundColor: l.color }}></span>
              <span className="chip-name">{l.name}</span>
            </label>
          ))}
        </div>

        <div className="calendar-content-wrapper">
          <div className="calendar-card">
            <h2 className="calendar-header">📅 {user.nickName}님의 소비 달력</h2>
            <Calendar 
              onClickDay={(date) => setSelectedDate(date.toISOString().split('T')[0])} 
              tileContent={renderTileContent}
              formatDay={(locale, date) => date.getDate()}
              calendarType="gregory" 
              activeStartDate={currentDate}
              onActiveStartDateChange={({activeStartDate}) => setCurrentDate(activeStartDate)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default CalendarView;
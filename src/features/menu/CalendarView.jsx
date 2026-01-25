import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './CalendarView.css'; 

function CalendarView({
  transactions = [], 
  currentDate, 
  setCurrentDate
}) {
  const ledgers = [
    { id: 'personal', name: '내 가계부', color: '#0066ff' },
    { id: 'group_1', name: '우리 가족 가계부', color: '#ff9f43' },
    { id: 'group_2', name: '연인과 함께 가계부', color: '#ee5253' }
  ];

  const [activeLedgers, setActiveLedgers] = useState(['personal', 'group_1', 'group_2']);
  const [selectedDate, setSelectedDate] = useState(null);

  const isAllSelected = activeLedgers.length === ledgers.length;

  const toggleAll = () => {
    if (isAllSelected) {
      setActiveLedgers([]);
    } else {
      setActiveLedgers(ledgers.map(l => l.id));
    }
  };

  const toggleLedger = (id) => {
    setActiveLedgers(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const filteredData = useMemo(() => {
    return transactions.filter(item => activeLedgers.includes(item.ledger_id));
  }, [transactions, activeLedgers]);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = formatDate(date);
      const dayData = filteredData.filter(item => item.date === dateString);
      if (dayData.length > 0) {
        const income = dayData.filter(i => i.type === 'INCOME').reduce((s, i) => s + i.amount, 0);
        const expense = dayData.filter(i => i.type === 'EXPENSE').reduce((s, i) => s + i.amount, 0);
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

  const details = useMemo(() => {
    if (!selectedDate) return [];
    return filteredData.filter(item => item.date === selectedDate);
  }, [filteredData, selectedDate]);

  return (
    <main className="fade-in">
      <div className="calendar-page-container">
        <div className="ledger-filter-bar">
          <label className="filter-chip all-filter">
            <input 
              type="checkbox" 
              checked={isAllSelected} 
              onChange={toggleAll} 
            />
            <span className="chip-name">전체</span>
          </label>
          
          <div className="divider"></div>

          {ledgers.map(l => (
            <label key={l.id} className="filter-chip">
              <input 
                type="checkbox" 
                checked={activeLedgers.includes(l.id)} 
                onChange={() => toggleLedger(l.id)} 
              />
              <span className="dot" style={{ backgroundColor: l.color }}></span>
              <span className="chip-name">{l.name}</span>
            </label>
          ))}
        </div>

        <div className="calendar-content-wrapper">
          <div className="calendar-card">
            <h2 className="calendar-header">📅 오소리님의 소비 달력</h2>
            <Calendar 
              onClickDay={(date) => setSelectedDate(formatDate(date))} 
              tileContent={renderTileContent}
              tileClassName={({date, view}) => (view === 'month' && date.getDay() === 6 ? 'saturday' : null)}
              formatDay={(locale, date) => date.getDate()}
              calendarType="gregory" 
              activeStartDate={currentDate}
              onActiveStartDateChange={({activeStartDate}) => setCurrentDate(activeStartDate)}
            />
          </div>

          <div className="detail-card">
            <h3 className="detail-title">{selectedDate ? `${selectedDate.split('-')[0]}년 ${selectedDate.split('-')[1]}월 ${selectedDate.split('-')[2]}일 내역` : '날짜를 선택하세요'}</h3>
            <div className="detail-list-container">
              {details.length > 0 ? (
                <ul className="detail-list">
                  {details.map(item => (
                    <li key={item.tran_id} className={`detail-item ${item.type.toLowerCase()}`}>
                      <div className="item-info">
                        <div className="item-header">
                          <span className="ledger-badge" style={{ backgroundColor: item.ledger_color }}>{item.ledger_name}</span>
                          <span className="item-category">{item.category}</span>
                        </div>
                        <div className="item-body">
                          <span className="item-store">{item.store_name}</span>
                          <span className="item-memo">{item.memo}</span>
                        </div>
                      </div>
                      <span className="item-amount">
                        {item.type === 'INCOME' ? '+' : '-'}{item.amount.toLocaleString()}원
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">{selectedDate ? '내역이 없습니다.' : '날짜를 선택해 주세요.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CalendarView;
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function MemberChart({ transactions = [], groupbId, currentDate }) {
  if (!currentDate || !(currentDate instanceof Date)) return null;

  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const targetYM = `${targetYear}-${targetMonth}`;

  const groupExpenses = transactions.filter(t => 
    (t.groupbId === groupbId || t.ledger_id === groupbId) && 
    t.type?.toUpperCase() === 'OUT' && 
    (t.date || t.transDate)?.startsWith(targetYM)
  );

  const memberData = groupExpenses.reduce((acc, curr) => {
    const name = curr.userName || curr.nickName || curr.nickname || '익명';
    const cat = curr.category || '기타';
    const amount = Math.abs(curr.amount || curr.originalAmount || 0);

    if (!acc[name]) acc[name] = {};
    acc[name][cat] = (acc[name][cat] || 0) + amount;
    return acc;
  }, {});

  const members = Object.keys(memberData);
  const VALID_CATEGORIES = ['식비', '생활/마트', '쇼핑', '의료/건강', '교통', '문화/여가', '교육', '기타'];
  const colors = ['#FF6384', '#4BC0C0', '#FFCE56', '#36A2EB', '#9966FF', '#FF9F40', '#42A5F5', '#C9CBCF'];

  // 3. 차트 데이터 구성
  const data = {
    labels: members.length > 0 ? members : ['데이터 없음'],
    datasets: VALID_CATEGORIES.map((cat, idx) => ({
      label: cat,
      data: members.map(m => memberData[m][cat] || 0),
      backgroundColor: colors[idx],
    }))
  };

  const getNicknames = () => {
    const titles = [];
    VALID_CATEGORIES.forEach(cat => {
      let maxSpender = { name: '', amount: 0 };
      members.forEach(m => {
        const spent = memberData[m][cat] || 0;
        if (spent > maxSpender.amount) {
          maxSpender = { name: m, amount: spent };
        }
      });
      if (maxSpender.name && maxSpender.amount > 0) {
        titles.push({ name: maxSpender.name, title: `${cat} 대장` });
      }
    });
    return titles;
  };

  return (
    <div className="info-card">
      <h3>🧬 멤버별 소비</h3>
      <div style={{ height: '250px' }}>
        <Bar data={data} options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: { 
            x: { stacked: true, grid: { display: false } }, 
            y: { stacked: true } 
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
          }
        }} />
      </div>
      <div className="dna-badges" style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {getNicknames().length > 0 ? (
          getNicknames().slice(0, 3).map((n, i) => (
            <span key={i} style={{ background: '#f0f4ff', color: '#0066ff', padding: '5px 12px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              👑 {n.name}: {n.title}
            </span>
          ))
        ) : (
          <p style={{ fontSize: '0.8rem', color: '#999' }}>이번 달 지출 대장이 아직 없어요!</p>
        )}
      </div>
    </div>
  );
}

export default MemberChart;
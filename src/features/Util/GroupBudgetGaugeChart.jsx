import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function GroupBudgetGauge({ transactions = [], groupbId, monthlyBudget = 2000000, currentDate }) {
  if (!currentDate || !(currentDate instanceof Date)) return null;

  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const targetYM = `${targetYear}-${targetMonth}`;
  
  const currentSpent = transactions
    .filter(t => 
      (t.groupbId === groupbId || t.ledger_id === groupbId) && 
      t.type?.toUpperCase() === 'OUT' && 
      (t.date || t.transDate)?.startsWith(targetYM)
    )
    .reduce((sum, t) => sum + Math.abs(t.amount || t.originalAmount || 0), 0);

  const lastDay = new Date(targetYear, currentDate.getMonth() + 1, 0).getDate();
  const today = new Date();
  const dayPassed = today.getMonth() === currentDate.getMonth() ? today.getDate() : lastDay;
  
  const projected = dayPassed > 0 ? Math.round((currentSpent / dayPassed) * lastDay) : currentSpent;
  const percent = monthlyBudget > 0 ? Math.round((currentSpent / monthlyBudget) * 100) : 0;
  const isOver = projected > monthlyBudget;

  const data = {
    labels: ['사용액', '잔액'],
    datasets: [{
      data: [currentSpent, Math.max(0, monthlyBudget - currentSpent)],
      backgroundColor: [percent > 90 ? '#ff4d4f' : '#0066ff', '#f0f2f5'],
      circumference: 180,
      rotation: 270,
      borderWidth: 0,
      cutout: '80%'
    }]
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw.toLocaleString()}원`
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="info-card">
      <h3>🎯 예산 달성률</h3>
      <div style={{ height: '180px', position: 'relative', marginTop: '10px' }}>
        <Doughnut data={data} options={options} />
        <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#333' }}>{percent}%</span>
          <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{currentSpent.toLocaleString()}원</p>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        padding: '12px', 
        borderRadius: '12px', 
        background: isOver ? '#fff1f0' : '#f6ffed',
        border: `1px solid ${isOver ? '#ffa39e' : '#b7eb8f'}`
      }}>
        {isOver ? (
          <p style={{ color: '#cf1322', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>
            ⚠️ 경고! 예상 지출액이 예산을 <strong>{(projected - monthlyBudget).toLocaleString()}원</strong> 초과할 것으로 보입니다.
          </p>
        ) : (
          <p style={{ color: '#389e0d', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>
            ✅ 안정적이에요! 현재 속도라면 예산 내에서 완주 가능합니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default GroupBudgetGauge;
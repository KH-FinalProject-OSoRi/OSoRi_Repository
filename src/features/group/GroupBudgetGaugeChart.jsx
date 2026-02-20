import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function GroupBudgetGauge({ transactions = [], groupbId, monthlyBudget, startDate, endDate }) {
  if(!monthlyBudget || monthlyBudget <= 0) {
    return (
      <>
        <div className="info-card" style={{minHeight: '120%'}}>
          <br/>
          <span style={{ fontSize: '3rem', textAlign: 'center',minHeight:'230px'}}>🎯
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: '5px 0', textAlign: 'center'}}>설정된 예산이 없습니다</h3>
            <p style={{ fontSize: '0.85rem', color: '#888', textAlign: 'center'}}>
              목표 예산을 설정하고<br />계획적인 소비 관리를 시작해보세요!
            </p>
          </span>
        </div>
      </>
    );
  }
  
  
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const currentSpent = transactions
    .filter(t => {
      const transDate = new Date(t.date);
      return (
        String(t.groupbId) === String(groupbId) && 
        t.type?.toUpperCase() === 'OUT' && 
        transDate >= start &&
        transDate <= end
      )
    })
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const today = new Date();
  const diffTime = today - start;
  const elapsedDays = Math.max(1, Math.min(totalDays, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));
  
  const calculatedPercent = monthlyBudget > 0 ? Math.round((currentSpent / monthlyBudget) * 100) : 0;
  const percent = Math.min(100, calculatedPercent);
  
  const availableBudget = (monthlyBudget - currentSpent) > 0 ? monthlyBudget - currentSpent : 0;
  const overAmount = currentSpent - monthlyBudget

  const getStatusColor = (pct) => {
    if (pct >= 90) return '#ff4d4f';
    if (pct >= 80) return '#fa8c16'; 
    if (pct >= 70) return '#fadb14'; 
    return '#52c41a'; 
  };

  const mainColor = getStatusColor(percent);

  const data = {
    labels: ['현재 사용액', '잔액'],
    datasets: [{
      data: [currentSpent, Math.max(0, monthlyBudget - currentSpent)],
      backgroundColor: [mainColor, '#f0f2f5'],
      circumference: 180,
      rotation: 270,
      borderWidth: 0,
      cutout: '80%',
      borderRadius: 5
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
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>🎯 예산 소진률</h3>
      <div style={{ position: 'relative', width: '100%', height: '160px', flex:1 }}>
        <Doughnut data={data} options={options} />
        <div style={{ 
            position: 'absolute', top: '70%', left: '50%', 
            transform: 'translate(-50%, -50%)', textAlign: 'center', 
        }}>
          <span style={{ fontSize: '2.2rem', fontWeight: '800', color: mainColor }}>
            {percent}%
          </span>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
            {currentSpent.toLocaleString()}원 / {monthlyBudget.toLocaleString()}원
          </p>
        </div>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        padding: '12px', 
        borderRadius: '12px', 
        background: `${mainColor}10`,
        border: `1px solid ${mainColor}40`,
        }}>
        <div className='rolling-container'>
          <div className='rolling-wrapper'>

            <p className='rolling-text' style={{ color: mainColor, fontWeight: 'bold' }}>
              {availableBudget.toLocaleString()}원 사용가능
            </p>

            <p className='rolling-text' style={{ color: mainColor, margin: 0, fontWeight: '800' }}>
              {percent >= 100 
                ? `🚨 ${overAmount.toLocaleString()}원 초과지출!` 
                : percent >= 90 
                ? '예산을 거의 다 썼어요! 지출에 주의하세요.' 
                : percent >= 70 
                ? '지출이 늘어나고 있어요. 확인이 필요합니다.' 
                : '아주 잘하고 계시네요! 계획적인 소비 중입니다.'}
            </p>

            <p className='rolling-text' style={{ color: mainColor, fontWeight: 'bold' }}>
              {availableBudget.toLocaleString()}원 사용가능
            </p>
          
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default GroupBudgetGauge;

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { predictNextMonthExpense, calculateProjectedExpense } from '../../Util/analytics';
import styles from './MyAccountBook.module.css';

// Chart.js 필수 구성 요소 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarController,
  LineController
);

function MonthlyTrendChart({ transactions = [], currentDate }) {
  if (!currentDate || !(currentDate instanceof Date)) {
    return <div className="chart-loading">차트 데이터를 불러오는 중...</div>;
  }
  const today = new Date();
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth();

  // 지출 내역을 바탕으로 차트 표시 월수 결정 (2개월 ~ 6개월)
  const expenseTransactions = transactions.filter(t => 
    t.type?.toUpperCase() === 'OUT' || t.type?.toUpperCase() === 'EXPENSE'
  );

  let startMonthOffset = 5; // 기본 6개월치
  if (expenseTransactions.length > 0) {
    const oldestDate = new Date(Math.min(...expenseTransactions.map(t => new Date(t.date))));
    const monthDiff = (today.getFullYear() - oldestDate.getFullYear()) * 12 + (today.getMonth() - oldestDate.getMonth());
    startMonthOffset = Math.min(Math.max(monthDiff, 1), 5);
  }

  const displayMonths = [];
  for (let i = startMonthOffset; i >= 0; i--) {
    const d = new Date(targetYear, targetMonth - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    displayMonths.push(`${year}-${month}`);
  }

  const monthlyTotals = expenseTransactions.reduce((acc, curr) => {
    const monthStr = curr.date.substring(0, 7);
    acc[monthStr] = (acc[monthStr] || 0) + Math.abs(curr.amount);
    return acc;
  }, {});

  const dataValues = displayMonths.map(month => monthlyTotals[month] || 0);
  const labels = displayMonths.map(month => `${parseInt(month.split('-')[1])}월`);

  // 데이터가 2개월 이상이고 현재 달을 보고 있을 때만 실행
  const availableDataPoints = dataValues.filter(v => v > 0).length;
  const isCurrentMonthView = displayMonths[displayMonths.length - 1] === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const shouldProject = availableDataPoints >= 2 && isCurrentMonthView;

  let finalLabels = labels;
  let actualData = [...dataValues];
  let projectedData = new Array(dataValues.length).fill(null);
  let summaryContent = null;
  let projectedCurrent = 0;
  let predictedAmount = 0;

  const roundToThousand = (num) => Math.round(num / 1000) * 1000;

  if (shouldProject) {
    // 이번 달 예상 지출액 계산
    const currentMonthSpent = actualData[actualData.length - 1];
    projectedCurrent = roundToThousand(calculateProjectedExpense(currentMonthSpent, today));
    projectedData[projectedData.length - 1] = projectedCurrent;

    // 다음 달 예측 (회귀 분석용 데이터)
    const trainingData = actualData.map((val, idx) => ({
      monthIndex: idx,
      amount: idx === actualData.length - 1 ? projectedCurrent : val
    }));
    predictedAmount = roundToThousand(predictNextMonthExpense(trainingData));

    finalLabels = [...labels, '다음 달(예측)'];
    actualData = [...actualData, 0];
    projectedData = [...projectedData, predictedAmount];

    summaryContent = (
      <div className={styles['chart-summary']} style={{textAlign : 'center'}}>
        이번 달 총 <strong>{projectedCurrent.toLocaleString()}원</strong> 지출 예상 &nbsp;&nbsp;|&nbsp;&nbsp;
        {/*<p><span>({Math.round((currentMonthSpent / projectedCurrent) * 100)}% 진행 중)</span></p>*/}
   
         다음 달 예상 지출: 약 <strong>{predictedAmount.toLocaleString()}원</strong>
        
      </div>
    );
  } else if (availableDataPoints < 2) {
    summaryContent = (
      <p className={styles['chart-summary']} style={{ color: '#b2bec3' }}>
        데이터가 2개월 이상 쌓이면 지출 예측 리포트를 제공해 드려요!
      </p>
    );
  }

  // 평균값 계산
  const validValues = shouldProject 
    ? [...dataValues.slice(0, -1), projectedCurrent] 
    : dataValues.filter(v => v > 0);
  const averageValue = validValues.length > 0 
    ? Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length) 
    : 0;

  const data = {
    labels: finalLabels,
    datasets: [
      {
        type: 'line',
        label: '평균 지출',
        data: new Array(finalLabels.length).fill(averageValue),
        borderColor: '#e74c3c',
        borderDash: [5, 5],
        pointRadius: 0,
        pointHitRaduis : 15,
        fill: false,
        order: 1
      },
      {
        type: 'bar',
        label: '실제 지출',
        data: actualData,
        backgroundColor: (ctx) => (shouldProject && ctx.dataIndex === actualData.length - 2 ? '#6c5ce7' : '#dcdde1'),
        borderRadius: 4,
        barThickness: 30,
        order: 2,
        grouped: false
      },
      {
        type: 'bar',
        label: '예상 지출',
        data: projectedData,
        backgroundColor: (ctx) => {
          if (shouldProject && ctx.dataIndex === projectedData.length - 1) return '#fab1a0';
          if (shouldProject && ctx.dataIndex === projectedData.length - 2) return 'rgba(108, 92, 231, 0.2)';
          return 'transparent';
        },
        borderRadius: 4,
        barThickness: 30,
        order: 3,
        grouped: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // 부모 높이에 맞춤
    interaction : {
      intersect : false,
      mode : 'index',
    },
    layout: {
      padding: {
      left: 40,   // 왼쪽 여백
      right: 40,  // 오른쪽 여백
      top: 0,     // 위쪽 (필요 없으면 0)
      bottom: 0   // 아래쪽 (필요 없으면 0)
    }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 10 }, padding: 5 }
      },

      tooltip : {
        enabled : true,
        filter : function (tooltipItem) {
          return tooltipItem.raw > 0;
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: true },
        ticks: { font: { size: 9 }, padding: 0 }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
    }
  };

  return (
    <div className={styles['chart-card']}>
      <h3>📈 월별 지출 분석 및 예측</h3>
      <div className={styles['chart-main-container']}>
        <Chart data={data} options={options} />
      </div>
      {summaryContent}
    </div>
  );
}

export default MonthlyTrendChart;
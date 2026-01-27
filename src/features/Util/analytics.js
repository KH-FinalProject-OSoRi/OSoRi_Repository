

// src/utils/analytics.js

// 선형 회귀 분석을 통한 다음 달 예측 함수
export const predictNextMonthExpense = (historyData) => {
  // historyData 형태: [ { monthIndex: 0, amount: 500000 }, { monthIndex: 1, amount: 520000 }, ... ]
  // monthIndex는 0, 1, 2... 순서대로 증가하는 정수

  const n = historyData.length;
  if (n < 2) return 0; // 데이터가 너무 적으면 예측 불가

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  historyData.forEach(point => {
    sumX += point.monthIndex;
    sumY += point.amount;
    sumXY += point.monthIndex * point.amount;
    sumXX += point.monthIndex * point.monthIndex;
  });

  // 기울기(slope) a와 절편(intercept) b 계산
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 다음 달(n번째 인덱스) 예측값 계산
  const nextMonthIndex = historyData[n - 1].monthIndex + 1;
  const predictedAmount = slope * nextMonthIndex + intercept;

  return Math.max(0, Math.round(predictedAmount)); // 음수가 나오지 않도록 처리
};

// 이번 달 마감 예상 지출 계산 함수
export const calculateProjectedExpense = (currentExpense, currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = currentDate.getDate();

  // 이번 달의 총 일수 (예: 28, 30, 31)
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  if (today === 0) return currentExpense; // 1일 이전 예외처리

  // (현재지출 / 오늘날짜) * 총일수
  const projected = (currentExpense / today) * lastDayOfMonth;
  
  return Math.round(projected);
};

export default predictNextMonthExpense;
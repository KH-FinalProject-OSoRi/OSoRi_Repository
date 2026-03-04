import { useMemo } from 'react';
import {predictNextMonthExpense, calculateProjectedExpense} from '../features/Util/analytics';

export function useSpendingAnalytics(transactions = [], currentDate) {
  const result = useMemo(() => {
    if (!currentDate || !(currentDate instanceof Date)) return null;

    const today = new Date();
    const targetYear = currentDate.getFullYear();
    const targetMonth = currentDate.getMonth();

    // 1. 지출 내역 필터링
    const expenseTransactions = transactions.filter(t => 
      t.type?.toUpperCase() === 'OUT' || t.type?.toUpperCase() === 'EXPENSE'
    );

    // 2. 분석 대상 월 리스트 생성 (최대 6개월)
    const displayMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetYear, targetMonth - i, 1);
      displayMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // 3. 월별 합계 계산
    const monthlyTotals = expenseTransactions.reduce((acc, curr) => {
      const monthStr = curr.date.substring(0, 7);
      acc[monthStr] = (acc[monthStr] || 0) + Math.abs(curr.amount);
      return acc;
    }, {});

    const dataValues = displayMonths.map(month => monthlyTotals[month] || 0);
    const availableDataPoints = dataValues.filter(v => v > 0).length;
    const isCurrentMonthView = displayMonths[5] === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let projectedCurrent = 0;
    let predictedAmount = 0;
    const roundToThousand = (num) => Math.round(num / 1000) * 1000;

    // 4. 예측 로직 실행 (데이터가 2개 이상일 때)
    if (availableDataPoints >= 2) {
      const currentMonthSpent = dataValues[dataValues.length - 1];
      projectedCurrent = roundToThousand(calculateProjectedExpense(currentMonthSpent, today));

      const trainingData = dataValues.map((val, idx) => ({
        monthIndex: idx,
        amount: idx === dataValues.length - 1 ? projectedCurrent : val
      }));
      predictedAmount = roundToThousand(predictNextMonthExpense(trainingData));
    }

    // 5. 평균 지출 계산
    const validValues = isCurrentMonthView 
      ? [...dataValues.slice(0, -1), projectedCurrent] 
      : dataValues.filter(v => v > 0);
    const averageValue = validValues.length > 0 
      ? Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length) 
      : 0;

    return {
      projectedCurrent,
      predictedAmount,
      averageValue,
      isCurrentMonthView,
      availableDataPoints,
      dataValues
    };
  }, [transactions, currentDate]);

  return result;
}
import React, { useMemo } from 'react';
import { zScore } from './zScore';
import './zScoreNotification.css'; 

const ZScoreNotification = ({ transactions, currentDate }) => {
  const analysisMessages = useMemo(() => {
    if (!currentDate) return ["데이터를 분석 중입니다..."];
    
    const notifications = zScore(transactions, currentDate);
    
    if (notifications.length === 0) {
      return ["✅ 이번 달은 아주 계획적으로 소비하고 계시네요!", "💰 지갑이 오소리 덕분에 튼튼해요!"];
    }
    
    return notifications.map(n => n.message);
  }, [transactions, currentDate]);

  return (
    <div className="notification-list-container">
      <div className="notification-list">
        {analysisMessages.map((text, index) => (
          <div key={index} className="notification-item">
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZScoreNotification;
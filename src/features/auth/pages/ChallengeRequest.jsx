import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChallengeRequest.css';

const ChallengeRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    duration: '3',
    category: '식비',
    mode: 'PERSONAL',
    targetCount: '1',
    status : 'N'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // DB 구조에 맞춘 페이로드 생성
    const dbPayload = {
      CHALLENGE_ID: `${formData.title.replace(/\s+/g, '_')}_${Date.now()}`,
      DESCRIPTION: formData.description || `${formData.title} 챌린지입니다.`,
      TARGET: parseInt(formData.targetAmount) || 0,
      DURATION: parseInt(formData.duration),
      CATEGORY: formData.category,
      TYPE: 'EXPENSE',
      STATUS: 'N',
      TARGET_COUNT: parseInt(formData.targetCount),
      CHALLENGE_MODE: formData.mode
    };
    
    console.log("서버로 전송될 데이터:", dbPayload);
    alert("🚀 챌린지가 성공적으로 생성되었습니다!");
    navigate(-1); // 생성 후 이전 페이지로 이동
  };

return (
  <div className="challenge-container">
    <button onClick={() => navigate(-1)} className="back-button">← 돌아가기</button>
    <h2 className="challenge-title">새로운 도전 시작하기 🚀</h2>

    <div>
    </div>

    
  </div>
);
};

export default ChallengeRequest;
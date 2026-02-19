import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChallengeRequest.css';
import axios from 'axios';
import { challengeApi } from '../../../api/challengeApi';

const ChallengeRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    duration: '3',
    category: '식비',
    mode: 'PERSONAL',
    targetAmount: '',
    targetCount: '1'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const now = new Date();
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(now.getMilliseconds()).padStart(3, '0'); // 중복 방지용 밀리초 추가

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser ? storedUser.loginId : "unknown";
    const uniqueId = `request_${userId}_${timestamp}`;

    const payload = {
      challengeId: uniqueId,
      description: `${formData.title}`,
      target: parseInt(formData.targetAmount) || 0,
      duration: parseInt(formData.duration),
      category: formData.category,
      type: 'EXPENSE',
      status: 'N', // 바로 활성화
      targetCount: parseInt(formData.targetCount) || 1,
      challengeMode: formData.mode
    };

    const response = await challengeApi.createChallenge(payload);

    if (response.status === 200 || response.status === 201) {
      alert("🚀 새로운 도전이 요청되었습니다!");
      navigate(-1); 
    }
  } catch (error) {
    console.error("저장 실패:", error);
    alert("❌ 저장에 실패했습니다.");
    }
};

  return (
    <div className="challenge-request-wrapper">
      <header className="content-header">
        <h2 className="main-title">새로운 챌린지 신청하기</h2>
        <p className="welcome-text">내 지갑부터 공동 자산까지, 오소리가 소비 흐름을 한눈에 정리해 드릴게요.</p>
      </header>

      <form className="challenge-form" onSubmit={handleSubmit}>
        <div className="setup-card">
          <div className="setup-row">
            <div className="setup-section">
              <label className="field-label">누구와 함께하나요?</label>
              <div className="mode-toggle">
                <button 
                  type="button" 
                  className={formData.mode === 'PERSONAL' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, mode: 'PERSONAL'})}
                >혼자하기</button>
                <button 
                  type="button" 
                  className={formData.mode === 'GROUP' ? 'active' : ''} 
                  onClick={() => setFormData({...formData, mode: 'GROUP'})}
                >함께하기</button>
              </div>
            </div>
            
            <div className="setup-section">
              <label className="field-label">챌린지 이름을 지어주세요</label>
              <input 
                type="text" 
                name="title" 
                placeholder="예: 커피값 아끼기 챌린지" 
                className="full-input" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
        </div>

        <div className="sentence-card">
          <p className="sentence-text">
            " <span style={{color: '#0066FF'}}>{formData.mode === 'PERSONAL' ? '나' : '우리'}</span>는 앞으로 
            <select name="duration" className="inline-field" onChange={handleChange} value={formData.duration}>
              <option value="3">3일</option>
              <option value="7">1주</option>
              <option value="30">한달</option>
            </select> 동안, 
            <select name="category" className="inline-field" onChange={handleChange} value={formData.category}>
              <option>식비</option>
              <option>생활/마트</option>
              <option>쇼핑</option>
              <option>의료/건강</option>
              <option>교통</option>
              <option>문화/여가</option>
              <option>교육</option>
              <option>기타</option>
            </select>에서 
            <input type="number" name="targetAmount" placeholder="금액" className="inline-field" style={{ width: '150px' }} onChange={handleChange} required /> 원을 
            <input type="number" name="targetCount" placeholder="횟수" className="inline-field" style={{ width: '80px' }} onChange={handleChange} required /> 번 이하로 사용할게요. "
          </p>
        </div>

        <div className="action-area">
          <button type="submit" className="submit-btn">
            챌린지 요청하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallengeRequest;
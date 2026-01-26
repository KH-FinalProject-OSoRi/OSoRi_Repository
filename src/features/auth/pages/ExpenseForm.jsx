import React, { useState, useRef, useEffect } from 'react';
import './ExpenseForm.css';
import transApi from '../../../api/transApi';
import { useAuth } from '../../../context/AuthContext';

const EXPENSE_CATEGORIES = [
  "식비", "생활/마트", "쇼핑", "의료/건강", 
  "교통", "문화/여가", "교육", "기타"
];

const INCOME_CATEGORIES = [
  "월급", "용돈", "금융소득", "상여금", "기타"
];


const ExpenseForm = ({ mode = 'personal', groupId }) => {

  const {user} = useAuth();

   // 현재 모드에 따라 보여줄 카테고리 리스트 결정
  const [currentCategories, setCurrentCategories] = useState(EXPENSE_CATEGORIES);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    type: '지출',
    transDate: '',      
    title: '',
    originalAmount: '',
    category: EXPENSE_CATEGORIES[0], 
    memo: ''
  });

  const handleTypeToggle = (type) => {
    const newCategories = type === '수입' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    
    setCurrentCategories(newCategories);
    
    setFormData({ 
      ...formData, 
      type: type, 
      transDate: '', 
      category: newCategories[0],
      title: '',
      originalAmount: '',
      memo: ''
    });
    
    if(type === '수입') setPreviewUrl(null);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => { setIsDragging(false); };
  
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const formatDateString = (dateString) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    try {
      const parts = dateString.split(/[\.\-\/\s년월일]+/).filter(part => part.trim() !== '');
      if (parts.length >= 3) {
        let year = parts[0].trim();
        if (year.length === 2) year = '20' + year;
        let month = parts[1].trim().padStart(2, '0');
        let day = parts[2].trim().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      const numbers = dateString.replace(/[^0-9]/g, '');
      if (numbers.length === 8) {
        return `${numbers.substring(0, 4)}-${numbers.substring(4, 6)}-${numbers.substring(6, 8)}`;
      }
    } catch (e) {
      console.error("날짜 변환 중 오류:", e);
    }
    return '';
  };

  const processFile = async (file) => {

    // 수입일 때는 영수증 처리 안 함
    if (formData.type === '수입') return;

    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);

    const serverFormData = new FormData();
    serverFormData.append('receipt', file);
    
    setIsLoading(true);

    try {
      const data = await transApi.receiptAnalyze(serverFormData);

      if (data) {
        const { title, transDate, originalAmount, category } = data;
        const formattedDate = formatDateString(transDate);

        let matchedCategory = EXPENSE_CATEGORIES.includes(category) ? category : '기타';

        setFormData(prev => ({
          ...prev,
          title: title || '',
          transDate: formattedDate,
          originalAmount: originalAmount || '',
          category: matchedCategory,
          type: '지출',
          memo: ''
        }));

        setTimeout(() => {
            alert("입력된 정보가 맞는지 확인해주세요");
        }, 100);
        
      }

    } catch (error) {
      console.error("OCR Error:", error);
      alert("영수증 분석에 실패했습니다. 직접 입력해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transDate || !formData.originalAmount || !formData.title) {
      alert("날짜, 금액, 가게명은 필수 입력 항목입니다.");
      return;
    }

    try {

      // 그룹 모드
      if (mode === 'group') {
        if (!groupId) {
          alert("그룹 정보가 없습니다!");
          return;
        }
        
        // groupId 데이터에 추가
        const groupData = { ...formData, groupId: groupId };
        
        // 그룹 API 호출

        console.log("Group Data:", groupData);
        
      } else {

        // 개인 모드
        await transApi.myTransSave({ ...formData, userId: user?.userId ,type: formData.type === '수입' ? 'IN' : 'OUT'})

      }

      alert("저장되었습니다!");
      
      // 저장 후 폼 초기화
      setFormData(prev => ({
        ...prev,
        transDate: '',
        title: '',
        originalAmount: '',
        category: prev.type === '수입' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
        memo: ''
      }));

      setPreviewUrl(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error("Save Error:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="expense-page-wrapper">
      <div className="expense-card">
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>영수증 분석 중입니다...</p>
          </div>
        )}

        <h2 className="section-title" style={{textAlign: 'center', fontSize: '1.8rem', marginTop: 0}}>
          {formData.type === '수입' ? '수입 등록 💵' : '지출 등록 💸'}
        </h2>
        
        <div className="type-toggle-container">
          <button 
            className={`type-btn ${formData.type === '수입' ? 'active income' : ''}`}
            onClick={() => handleTypeToggle('수입')}
          >
            수입
          </button>
          <button 
            className={`type-btn ${formData.type === '지출' ? 'active expense' : ''}`}
            onClick={() => handleTypeToggle('지출')}
          >
            지출
          </button>
        </div>

        {formData.type === '지출' && (
          <div 
            className={`ocr-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current.click()}
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Receipt Preview" className="preview-image" />
                <div className="re-upload-overlay"><span>🔄 다시 올리기</span></div>
              </>
            ) : (
              <>
                <div className="ocr-icon">🧾</div>
                <p className="ocr-text">영수증을 여기로 끌어오거나 클릭하세요</p>
              </>
            )}
            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={onFileInput}/>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">날짜</label>
            <input 
              type="date" 
              name="transDate"
              className="input-field"
              value={formData.transDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">{formData.type === '수입' ? '입금처 / 내용' : '거래처 / 가게명'}</label>
            <input 
              type="text" 
              name="title"
              className="input-field"
              placeholder={formData.type === '수입' ? "예: 회사, 부모님" : "예: 스타벅스, 식당"}
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">금액</label>
            <div className="amount-wrapper">
              <input 
                type="number" 
                name="originalAmount"
                className="input-field"
                placeholder="0"
                value={formData.originalAmount}
                onChange={handleChange}
                required
              />
              <span className="currency-unit">원</span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">카테고리</label>
            <select 
              name="category"
              className="input-field"
              value={formData.category}
              onChange={handleChange}
            >
              {currentCategories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 메모 */}
          <div className="input-group">
            <label className="input-label">메모</label>
            <textarea 
              name="memo"
              className="input-field"
              placeholder="내용을 입력하세요 (선택)"
              value={formData.memo}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" className={`submit-btn ${formData.type === '지출' ? 'expense-mode' : ''}`}>
            {formData.type === '수입' ? '수입 등록하기' : '지출 등록하기'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ExpenseForm;
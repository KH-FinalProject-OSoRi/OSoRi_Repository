import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  //멤버찾기
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [searchNickname, setSearchNickname] = useState(''); 
  const [memList, setMemList] = useState([]);
  const [selectedMemList, setSelectedMemList] = useState([]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchKeyword.trim().length >= 1) { 
        fetchMemList();
      } else {
        setMemList([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchNickname]);

  const fetchMemList = async () => {
    try {
      // 닉네임 검색 API 호출
      const data = await groupBudgetApi.searchMem(searchNickname);
      // 자신은 제외
      setMemList(Array.isArray(data) ? data.filter(mem => mem.userId !== user?.userId) : []);
    } catch (error) {
      console.error('멤버 조회 실패', error);
    }
  };

  const handleSelectMember = (targetUser) => {
    if (selectedMemList.some(mem => mem.userId === targetUser.userId)) {
      alert("이미 추가된 멤버입니다.");
      return;
    }
    setSelectedMemList(prev => [...prev, targetUser]);
    setSearchKeyword("");
    setMemList([]);
  };

  const handleDeleteMember = (delId) => {
    setSelectedMemList(prev => prev.filter(mem => mem.userId !== delId));
  };

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
      const isIncome = formData.type === '수입';
      const transType = isIncome ? 'IN' : 'OUT';

      // 그룹 모드
      if (mode === 'group') {
        if (!groupId) {
          alert("그룹 정보가 없습니다!");
          return;
        }
        
        // 그룹 API 호출
        await transApi.groupTransSave({ ...formData, userId: user?.userId ,groupBId: Number(groupId),type: formData.type === '수입' ? 'IN' : 'OUT',nickName: user?.nickname || ""})

        if (isSplitActive && selectedMemList.length > 0) {

        const totalPeople = selectedMemList.length + 1;
        const splitAmount = Math.floor(Number(formData.originalAmount) / totalPeople);
        const allMemberIds = [...selectedMemList.map(m => m.userId), user?.userId];

        // 선택된 멤버 개인 가계부 저장 API 
        const splitPromises = allMemberIds.map(targetId => {
          return transApi.myTransSave({
            ...formData,
            title: `[그룹분할] ${formData.title}`, // 제목 수정
            originalAmount: splitAmount,           // 분할된 금액
            userId: targetId,                    // 해당 멤버의 ID
            type: transType,
            memo: `${user?.nickname}님이 등록한 그룹 지출 분할`
          });
        });

        await Promise.all(splitPromises);
        
      }

      } else {

        // 개인 모드
        await transApi.myTransSave({ ...formData, userId: user?.userId ,type: formData.type === '수입' ? 'IN' : 'OUT'})

      }
      alert("저장되었습니다!");
      if (mode === 'group') {
          navigate(`/mypage/groupAccountBook?groupId=${groupId}`);
      } else {
          navigate('/mypage/myAccountBook');
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

          {/* 나눌 멤버 */}
          {mode === 'group' && formData.type === '지출' && (
            <div className="split-member-section">
              <div className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <input 
                  type="checkbox" 
                  id="splitActive" 
                  checked={isSplitActive} 
                  onChange={(e) => setIsSplitActive(e.target.checked)} 
                />
                <label htmlFor="splitActive" style={{ fontWeight: 'bold', cursor: 'pointer' }}>나눌 멤버 추가하기 (N빵)</label>
              </div>

              {isSplitActive && (
                <div className="member-search-area" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="검색할 멤버 닉네임 입력"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  {memList.length > 0 && (
                    <ul className="search-results-list" style={{ listStyle: 'none', padding: '10px 0' }}>
                      {memList.map((mem) => (
                        <li key={mem.userId} onClick={() => handleSelectMember(mem)} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #ddd' }}>
                          {mem.nickname} ({mem.loginId}) <span style={{ color: '#00008B', fontWeight: 'bold' }}>[추가]</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="selected-members-badges" style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedMemList.map((mem) => (
                      <span key={mem.userId} className="member-badge" style={{ background: '#00008B', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
                        {mem.loginId} 
                        <button type="button" onClick={() => handleDeleteMember(mem.userId)} style={{ background: 'none', border: 'none', color: 'white', marginLeft: '5px', cursor: 'pointer' }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" className={`submit-btn ${formData.type === '지출' ? 'expense-mode' : ''}`}>
            {formData.type === '수입' ? '수입 등록하기' : '지출 등록하기'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ExpenseForm;
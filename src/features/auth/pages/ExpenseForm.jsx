import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpenseForm.css';
import transApi from '../../../api/transApi';
import { useAuth } from '../../../context/AuthContext';
import groupBudgetMemApi from '../../../api/groupBudgetMemApi';

const EXPENSE_CATEGORIES = ["식비", "생활/마트", "쇼핑", "의료/건강", "교통", "문화/여가", "교육", "기타"];
const INCOME_CATEGORIES = ["월급", "용돈", "금융소득", "상여금", "기타"];

const ExpenseForm = ({ mode = 'personal', groupId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 멤버 관련 상태
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [memList, setMemList] = useState([]);
  const [selectedMemList, setSelectedMemList] = useState([]);
  const [splitResult, setSplitResult] = useState({ amount: 0, count: 1 });
  const [groupName, setGroupName] = useState('');

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

  // 그룹 멤버 로드
  useEffect(() => {
    if (mode === 'group' && groupId) {
      fetchGroupMembers();
    }
  }, [groupId, mode]);

  const fetchGroupMembers = async () => {
    try {
      const data = await groupBudgetMemApi.searchGroupMem(groupId);
      // 자신은 목록에서 제외
      setMemList(Array.isArray(data) ? data.filter(mem => mem.userId !== user?.userId) : []);
    } catch (error) {
      console.error('멤버 로드 실패', error);
    }
  };

  // N빵 금액 계산 로직
  useEffect(() => {
    if (isSplitActive && formData.originalAmount) {
      const totalAmount = Number(formData.originalAmount);
      if (totalAmount > 0) {
        const count = selectedMemList.length + 1; // 본인 포함
        const amount = Math.floor(totalAmount / count);
        setSplitResult({ amount, count });
      }
    }
  }, [formData.originalAmount, selectedMemList, isSplitActive]);

  const handleMemberToggle = (member) => {
    setSelectedMemList(prev => {
      const isSelected = prev.some(m => m.userId === member.userId);
      if (isSelected) return prev.filter(m => m.userId !== member.userId);
      return [...prev, member];
    });
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };
  const onFileInput = (e) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
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
    } catch (e) { console.error(e); }
    return '';
  };

  const processFile = async (file) => {
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
        setFormData(prev => ({
          ...prev,
          title: title || '',
          transDate: formatDateString(transDate),
          originalAmount: originalAmount || '',
          category: EXPENSE_CATEGORIES.includes(category) ? category : '기타',
        }));
        setTimeout(() => alert("입력된 정보가 맞는지 확인해주세요"), 100);
      }
    } catch (error) { alert("영수증 분석 실패"); } finally { setIsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transDate || !formData.originalAmount || !formData.title) {
      alert("필수 입력 항목을 확인해주세요.");
      return;
    }
    try {
      const isIncome = formData.type === '수입';
      const transType = isIncome ? 'IN' : 'OUT';

      if (mode === 'group') {
        if (!groupId) return;
        // 그룹 가계부 저장
        await transApi.groupTransSave({ 
          ...formData, 
          userId: user?.userId, 
          groupBId: Number(groupId), 
          type: transType, 
          nickName: user?.nickName || user?.nickname || "" 
        });
        
        // 분할 저장
        if (isSplitActive && selectedMemList.length > 0) {
          const totalPeople = selectedMemList.length + 1;
          const splitAmount = Math.floor(Number(formData.originalAmount) / totalPeople);
          const allMemberIds = [...selectedMemList.map(m => m.userId), user?.userId];

          const splitPromises = allMemberIds.map(targetId => {
            return transApi.myTransSave({
              ...formData,
              title: `[👨‍👩‍👧‍👦그룹분할] ${formData.title}`,
              originalAmount: splitAmount,
              userId: targetId,
              type: transType,
              isShared: 'Y',
              groupTransId: Number(groupId),
              memo: `${user?.nickName || user?.nickname || '멤버'}님이 등록한 그룹 지출 분할`
            });
          });
          await Promise.all(splitPromises);
        }
      } else {
        await transApi.myTransSave({ ...formData, userId: user?.userId ,type: transType });
      }
      alert("저장되었습니다!");
      navigate(mode === 'group' ? `/mypage/groupAccountBook?groupId=${groupId}` : '/mypage/myAccountBook');
    } catch (error) { alert("저장 중 오류 발생"); }
  };

  return (
    <div className="expense-page-wrapper">
      <div className="expense-card">
        {isLoading && (
          <div className="loading-overlay"><div className="spinner"></div><p>영수증 분석 중입니다...</p></div>
        )}

        <div className="card-header">
          <h2 className="section-title">{formData.type === '수입' ? '수입 등록 💵' : '지출 등록 💸'}</h2>
          <div className="type-toggle-container">
            <button type="button" className={`type-btn ${formData.type === '수입' ? 'active income' : ''}`} onClick={() => handleTypeToggle('수입')}>수입</button>
            <button type="button" className={`type-btn ${formData.type === '지출' ? 'active expense' : ''}`} onClick={() => handleTypeToggle('지출')}>지출</button>
          </div>
        </div>

        {formData.type === '지출' && (
          <div className="ocr-upload-area" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current.click()}>
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Receipt Preview" className="preview-image" />
                <div className="re-upload-overlay"><span>🔄 다시 올리기</span></div>
              </>
            ) : (
              <><div className="ocr-icon" style={{fontSize: '3rem'}}>🧾</div><p className="ocr-text">영수증을 여기로 끌어오거나 클릭하세요</p></>
            )}
            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={onFileInput}/>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group"><label className="input-label">날짜</label><input type="date" name="transDate" className="input-field" value={formData.transDate} onChange={handleChange} required /></div>
          <div className="input-group"><label className="input-label">{formData.type === '수입' ? '입금처 / 내용' : '거래처 / 가게명'}</label><input type="text" name="title" className="input-field" placeholder={formData.type === '수입' ? "예: 회사, 부모님" : "예: 스타벅스, 식당"} value={formData.title} onChange={handleChange} required /></div>
          <div className="input-group"><label className="input-label">금액</label><div className="amount-wrapper"><input type="number" name="originalAmount" className="input-field" placeholder="0" value={formData.originalAmount} onChange={handleChange} required /><span className="currency-unit">원</span></div></div>
          <div className="input-group"><label className="input-label">카테고리</label><select name="category" className="input-field" value={formData.category} onChange={handleChange}>{currentCategories.map((cat, index) => <option key={index} value={cat}>{cat}</option>)}</select></div>
          <div className="input-group"><label className="input-label">메모</label><textarea name="memo" className="input-field" placeholder="내용을 입력하세요 (선택)" value={formData.memo} onChange={handleChange}></textarea></div>

          {mode === 'group' && formData.type === '지출' && (
            <div className="split-section">
              <div className="split-toggle-wrapper">
                <input type="checkbox" id="splitActive" checked={isSplitActive} onChange={(e) => setIsSplitActive(e.target.checked)} />
                <label htmlFor="splitActive" className="split-toggle-label">나눌 멤버 추가하기</label>
              </div>
              {isSplitActive && (
                <>
                  <div className="member-list-grid">
                    {memList.length > 0 ? memList.map((mem) => (
                      <label key={mem.userId} className="member-item-label">
                        <input type="checkbox" checked={selectedMemList.some(m => m.userId === mem.userId)} onChange={() => handleMemberToggle(mem)} />
                        <span className="member-nickname">{mem.nickName}</span>
                      </label>
                    )) : <p className="no-member-text">그룹에 다른 멤버가 없습니다.</p>}
                  </div>
                  {formData.originalAmount > 0 && (
                    <div className="split-result-box">
                      <p className="split-result-info">총 <strong>{splitResult.count}명</strong> 분할 (본인 포함)</p>
                      <h4 className="split-result-amount">1인당 부담금: <strong>{splitResult.amount.toLocaleString()}원</strong></h4>
                    </div>
                  )}
                </>
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
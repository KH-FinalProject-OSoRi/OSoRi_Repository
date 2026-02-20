import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpenseForm.css';
import transApi from '../../../api/transApi';
import { useAuth } from '../../../context/AuthContext';
import groupBudgetMemApi from '../../../api/groupBudgetMemApi';

const EXPENSE_CATEGORIES = ["식비", "생활/마트", "쇼핑", "의료/건강", "교통", "문화/여가", "교육", "기타"];
const INCOME_CATEGORIES = ["월급", "용돈", "금융소득", "상여금", "기타"];

const ExpenseForm = ({ mode = 'personal', groupId, groupStart, groupEnd }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 멤버 관련 상태
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [memList, setMemList] = useState([]);
  const [selectedMemList, setSelectedMemList] = useState([]);
  const [splitResult, setSplitResult] = useState({ amount: 0, count: 1 });
  const [groupName, setGroupName] = useState('');
  
  //날짜 관련 
  const [groupPeriod, setGroupPeriod] = useState({ start: '', end: '' });

  const [currentCategories, setCurrentCategories] = useState(EXPENSE_CATEGORIES);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [recentItems, setRecentItems] = useState([]);

  const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  };

const [individualAmounts, setIndividualAmounts] = useState({}); 

// 각 멤버가 입력 가능한 최대 금액 계산 함수
const getMaxAmountForMember = (userId) => {
  const totalAmount = Number(formData.originalAmount);
  if (!totalAmount || totalAmount <= 0) return totalAmount;

  // 현재 멤버를 제외한 다른 멤버들 중 실제로 입력한 금액만 합계 계산
  // 입력하지 않은 멤버는 합계에서 제외 (기본 분할액 사용 안 함)
  const otherMembersTotal = selectedMemList
    .filter(mem => mem.userId !== userId)
    .reduce((acc, mem) => {
      // 실제로 입력한 금액만 사용 (입력 안 했으면 0)
      const memAmount = individualAmounts[mem.userId] 
        ? Number(individualAmounts[mem.userId]) 
        : 0;
      return acc + memAmount;
    }, 0);

  // 남은 금액 = 총액 - 다른 멤버들이 실제로 입력한 합계
  const maxAllowed = totalAmount - otherMembersTotal;
  return maxAllowed > 0 ? maxAllowed : 0;
};

const handleAmountInput = (userId, value) => {
  // 빈 값이면 그냥 저장
  if (!value || value === '') {
    setIndividualAmounts(prev => ({
      ...prev,
      [userId]: value
    }));
    return;
  }

  const inputAmount = Number(value);
  
  // 음수 입력 방지
  if (inputAmount < 0) {
    alert("금액은 0 이상이어야 합니다.");
    return;
  }

  // 총액 확인
  const totalAmount = Number(formData.originalAmount);
  if (!totalAmount || totalAmount <= 0) {
    setIndividualAmounts(prev => ({
      ...prev,
      [userId]: value
    }));
    return;
  }

  // 이 멤버가 입력 가능한 최대 금액 계산
  const maxAllowed = getMaxAmountForMember(userId);

  // 입력 금액이 최대 허용 금액을 초과하면 최대값으로 제한
  if (inputAmount > maxAllowed) {
    alert(`총 금액(${totalAmount.toLocaleString()}원)을 초과할 수 없습니다.\n이 멤버의 최대 입력 가능 금액: ${maxAllowed.toLocaleString()}원`);
    setIndividualAmounts(prev => ({
      ...prev,
      [userId]: maxAllowed
    }));
    return;
  }

  // 검증 통과 시 저장
  setIndividualAmounts(prev => ({
    ...prev,
    [userId]: value
  }));
};

  const [formData, setFormData] = useState({
    type: '지출',
    transDate: '',
    title: '',
    originalAmount: '',
    category: EXPENSE_CATEGORIES[0],
    memo: ''
  });

  useEffect(() => {
    const fetchRecent = async () => {
      if (user?.userId) {
        try {
          const data = await transApi.recentTrans(user.userId);
          setRecentItems(data || []);
        } catch (error) {
          console.error("최근 내역 로드 실패", error);
        }
      }
    };
    fetchRecent();
  }, [user?.userId]);

  const handleQuickFill = (item) => {
    const isIncome = item.type === 'IN';
    const typeLabel = isIncome ? '수입' : '지출';
    const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    setCurrentCategories(categories);
    setFormData({
      ...formData,
      type: typeLabel,
      title: item.title,
      originalAmount: item.originalAmount,
      
      category: categories.includes(item.category) ? item.category : categories[0],
    });
  };

  // 그룹 멤버
  const fetchGroupMembers = async () => {
    try {

      const memData = await groupBudgetMemApi.searchGroupMem(groupId);
      setMemList(Array.isArray(memData) ? memData.filter(mem => mem.userId !== user?.userId) : []);

      const groupInfoResponse = await transApi.groupInfo(groupId); 
      

      if (groupInfoResponse) {
        setGroupName(groupInfoResponse.title || groupInfoResponse.TITLE);
        const sDate = groupInfoResponse.startDate || groupInfoResponse.START_DATE || '';
        const eDate = groupInfoResponse.endDate || groupInfoResponse.END_DATE || '';

        setGroupPeriod({
          start: sDate,
          end: eDate
        });
        
      }
    } catch (error) {
      console.error('데이터 로드 실패', error);
    }
  };

  useEffect(() => {
    if (mode === 'group' && groupId) {
      fetchGroupMembers();
    }
  }, [groupId, mode]);

  // 금액 계산 로직
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
      if (isSelected) {
        const newAmounts = { ...individualAmounts };
        delete newAmounts[member.userId];
        setIndividualAmounts(newAmounts);
        return prev.filter(m => m.userId !== member.userId);
      }
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
    if (type === '수입') setPreviewUrl(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'originalAmount' && value < 0) {
        alert("금액은 음수를 입력할 수 없습니다.");
        setFormData(prev => ({ ...prev, [name]: '' }));
        return;
      }

    if (name === 'transDate' && value) {
      const today = getToday();
      const maxLimit = (mode === 'group' && groupPeriod.end && groupPeriod.end < today)
        ? groupPeriod.end
        : today;

      if (mode === 'group' && groupPeriod.start && value < groupPeriod.start) {
        alert(`그룹 활동 시작일(${groupPeriod.start}) 이전은 선택할 수 없습니다.`);
        return;
      }

      if (value > maxLimit) {
        const msg = maxLimit === today
          ? "미래 날짜는 입력할 수 없습니다."
          : `그룹 종료일(${maxLimit})을 넘길 수 없습니다.`;
        alert(msg);
        setFormData(prev => ({ ...prev, [name]: maxLimit }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
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
        const formattedDate = formatDateString(transDate);

        const today = getToday();
        const maxLimit = (mode === 'group' && groupPeriod.end && groupPeriod.end < today)
          ? groupPeriod.end
          : today;

        let finalDate = formattedDate;

        if (formattedDate) {
          if (mode === 'group' && groupPeriod.start && formattedDate < groupPeriod.start) {
            alert(`그룹 시작일(${groupPeriod.start}) 이전 날짜가 감지되어 오늘 날짜로 변경되었습니다.`);
            finalDate = today;
          }
          else if (formattedDate > maxLimit) {
            const msg = maxLimit === today
              ? "미래 날짜는 등록할 수 없어 오늘 날짜로 변경되었습니다."
              : `그룹 종료일(${maxLimit}) 이후 날짜는 등록할 수 없어 오늘 날짜로 변경되었습니다.`;
            alert(`${msg}`);
            finalDate = today;
          }
        }
        setFormData(prev => ({
          ...prev,
          title: title || '',
          transDate: finalDate,
          originalAmount: originalAmount || '',
          category: EXPENSE_CATEGORIES.includes(category) ? category : '기타',
        }));
        setTimeout(() => alert("입력된 정보가 맞는지 확인해주세요"), 100);
      }
    } catch (error) { alert("영수증 분석 실패"); } finally { setIsLoading(false); }
  };

  const today = getToday();
  const maxLimit = (mode === 'group' && groupPeriod.end && groupPeriod.end < today)
    ? groupPeriod.end
    : today;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transDate || !formData.originalAmount || Number(formData.originalAmount) <= 0 || !formData.title) {
      alert("필수 입력 항목을 확인해주세요.");
      return;
    }

    const todayStr = getToday();
    const startLimit = groupPeriod.start;
    const endLimit = groupPeriod.end;

    const limitDate = (mode === 'group' && endLimit && endLimit < todayStr)
      ? endLimit
      : todayStr;

    if (mode === 'group') {
      if (startLimit && formData.transDate < startLimit) {
        alert(`[저장 실패] 그룹 활동 시작일(${startLimit}) 이전 날짜입니다.\n활동 기간 내의 날짜만 입력해주세요.`);
        return;
      }
    }

    const inputDate = new Date(formData.transDate);
    const startDate = groupPeriod.start ? new Date(groupPeriod.start) : null;
    const todayDate = new Date(getToday());

    if (mode === 'group' && startDate && inputDate < startDate) {
      alert(`[저장 실패] 그룹 활동 시작일(${groupPeriod.start}) 이전 날짜입니다.`);
      return;
    }

    if (inputDate > todayDate) {
      alert("[저장 실패] 미래 날짜는 저장할 수 없습니다.");
      return;
    }

    try {
      const isIncome = formData.type === '수입';
      const transType = isIncome ? 'IN' : 'OUT';

      if (mode === 'group') {
        if (!groupId) return;
        
        await transApi.groupTransSave({ 
          ...formData, 
          userId: user?.userId, 
          groupBId: Number(groupId), 
          type: transType, 
          nickName: user?.nickName || user?.nickname || "" 
        });
        
        if (isSplitActive && selectedMemList.length > 0) {
        const defaultSplitAmount = Math.floor(Number(formData.originalAmount) / (selectedMemList.length + 1));
  
         let totalOthersAmount = 0; 

        const splitPromises = selectedMemList.map(mem => {
          const finalAmount = individualAmounts[mem.userId] 
            ? Number(individualAmounts[mem.userId]) 
            : defaultSplitAmount;

          totalOthersAmount += finalAmount;

            return transApi.myTransSave({
              ...formData,
              title: `[👨‍👩‍👧‍👦그룹분할] ${formData.title}`,
              originalAmount: finalAmount, 
              userId: mem.userId,
              type: transType,
              isShared: 'Y',
              groupTransId: Number(groupId),
              memo: `[${user?.nickName}]님이 [${groupName}]에 등록한 지출 분할`
            });
          });

          const myFinalAmount = Number(formData.originalAmount) - totalOthersAmount;

          if (myFinalAmount >= 0) {
            splitPromises.push(transApi.myTransSave({
              ...formData,
              title: `[👨‍👩‍👧‍👦그룹분할] ${formData.title}`,
              originalAmount: myFinalAmount,
              userId: user?.userId,
              type: transType,
              isShared: 'Y',
              groupTransId: Number(groupId),
              memo: `[${groupName}] 그룹 지출 정산`
            }));
          }

          await Promise.all(splitPromises);
        }
      } else {
        await transApi.myTransSave({ ...formData, userId: user?.userId, type: transType });
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

        {mode === 'personal' && recentItems.length > 0 && (
          <div className="recent-container">
            <p className="recent-title">⚡ 최근 내역으로 빠른 입력</p>
            <div className="recent-list">
              {recentItems.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className={`recent-item-chip ${item.type === 'IN' ? 'income' : 'expense'}`}
                  onClick={() => handleQuickFill(item)}
                >
                  <span className="recent-item-name">{item.title}</span>
                  <span className="recent-item-price">{Number(item.originalAmount).toLocaleString()}원</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {formData.type === '지출' && (
          <div className="ocr-upload-area" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current.click()}>
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Receipt Preview" className="preview-image" />
                <div className="re-upload-overlay"><span>🔄 다시 올리기</span></div>
              </>
            ) : (
              <><div className="ocr-icon" style={{ fontSize: '3rem' }}>🧾</div><p className="ocr-text">영수증을 여기로 끌어오거나 클릭하세요</p></>
            )}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={onFileInput} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group"><label className="input-label">날짜</label><input type="date" name="transDate" className="input-field" value={formData.transDate} onChange={handleChange} min={mode === 'group' ? groupPeriod.start : ''} max={maxLimit}
            onBlur={(e) => {
              const val = e.target.value;
              if (!val) return;
              if (mode === 'group' && groupPeriod.start && val < groupPeriod.start) {
                alert(`그룹 활동 시작일(${groupPeriod.start}) 이전은 선택할 수 없습니다.`);
                setFormData(prev => ({ ...prev, transDate: groupPeriod.start }));
              }
              else if (val > maxLimit) {
                const msg = maxLimit === today
                  ? "미래 날짜는 등록할 수 없습니다."
                  : `그룹 종료일(${maxLimit}) 이후는 등록할 수 없습니다.`;
                alert(msg);
                setFormData(prev => ({ ...prev, transDate: maxLimit }));
              }
            }} required /></div>
          <div className="input-group"><label className="input-label">{formData.type === '수입' ? '입금처 / 내용' : '거래처 / 가게명'}</label><input type="text" name="title" className="input-field" placeholder={formData.type === '수입' ? "예: 회사, 부모님" : "예: 스타벅스, 식당"} value={formData.title} onChange={handleChange} required /></div>
          <div className="input-group"><label className="input-label">금액</label><div className="amount-wrapper"><input type="number" name="originalAmount" className="input-field" placeholder="0" value={formData.originalAmount} onChange={handleChange} min="0" required /><span className="currency-unit">원</span></div></div>
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
                    {memList.length > 0 ? memList.map((mem) => {
                      const isSelected = selectedMemList.some(m => m.userId === mem.userId);
                      return (
                        <div key={mem.userId} className="member-split-row">
                          <label className="member-item-label">
                            <input type="checkbox" checked={isSelected} onChange={() => handleMemberToggle(mem)} />
                            <span className="member-nickname">{mem.nickName}</span>
                          </label>
                          
                          {isSelected && (
                            <div className="split-input-group">
                              <span className="suggested-amount">(기본: {splitResult.amount.toLocaleString()}원)</span>
                              <input 
                                type="number" 
                                placeholder="직접 입력"
                                className="input-field small"
                                value={individualAmounts[mem.userId] || ''} 
                                onChange={(e) => handleAmountInput(mem.userId, e.target.value)}
                                min="0"
                                max={getMaxAmountForMember(mem.userId)}
                              />
                              <span style={{ fontSize: '0.9rem' }}>원</span>
                              {formData.originalAmount > 0 && (
                                <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '4px' }}>
                                  (최대: {getMaxAmountForMember(mem.userId).toLocaleString()}원)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }) : <p className="no-member-text">그룹에 다른 멤버가 없습니다.</p>}
                  </div>

                  {formData.originalAmount > 0 && (
                    <div className="split-result-box">
                      <div className="split-summary-row">
                        <span>총 인원</span>
                        <span>{selectedMemList.length + 1}명 (본인 포함)</span>
                      </div>
                      <div className="split-summary-row">
                        <span>멤버 합계</span>
                        <span>
                          {selectedMemList.reduce((acc, mem) => 
                            acc + (individualAmounts[mem.userId] ? Number(individualAmounts[mem.userId]) : 0), 0
                          ).toLocaleString()} 원
                        </span>
                      </div>
                      
                      <div className="my-final-amount-row">
                        <span className="my-final-label">본인 부담금 (잔액)</span>
                        <span className="my-final-price">
                          {(Number(formData.originalAmount) - selectedMemList.reduce((acc, mem) => 
                            acc + (individualAmounts[mem.userId] ? Number(individualAmounts[mem.userId]) : 0), 0
                          )).toLocaleString()}원
                        </span>
                      </div>
                      <p className="split-guide-text">* 박스가 비어있으면 기본 가이드 금액이 적용됩니다.</p>
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
import React, { useState, useEffect } from 'react';
import './MyAccountBook.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import transApi from '../../../api/transApi';
// ★ [추가] ExpenseForm과 동일한 카테고리 상수 정의
const EXPENSE_CATEGORIES = [
  "식비", "생활/마트", "쇼핑", "의료/건강", 
  "교통", "문화/여가", "교육", "기타"
];

const INCOME_CATEGORIES = [
  "월급", "용돈", "금융소득", "상여금", "기타"
];

// 모달 컴포넌트
const TransactionModal = ({ isOpen, type, transaction, onClose, onSave, onDelete }) => {
    const [currentCategories, setCurrentCategories] = useState(EXPENSE_CATEGORIES);
    
    const [formData, setFormData] = useState({
        text: '', amount: 0, date: '', category: '기타', memo: '', type: 'OUT'
    });

    useEffect(() => {
        if (transaction) {
            const transType = transaction.type || 'OUT';
            const categories = transType === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
            setCurrentCategories(categories);

            setFormData({
                text: transaction.text,
                amount: Math.abs(transaction.amount),
                date: transaction.date,
                category: transaction.category,
                memo: transaction.memo || '',
                type: transType
            });
        }
    }, [transaction]);

    if (!isOpen) return null;


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value; 
        const newCategories = newType === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        
        setCurrentCategories(newCategories);
        
        setFormData(prev => ({
            ...prev,
            type: newType,
            category: newCategories[0] 
        }));
    };

    const isViewMode = type === 'view'; 
    const isDetailMode = type === 'edit' || type === 'view';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {isDetailMode ? (
                    <>
                        <h3>{isViewMode ? '📄 내역 상세' : '✏️ 내역 수정'}</h3>
                        
                        {isViewMode ? (
                            <div className="modal-type-display" style={{ 
                                textAlign: 'center', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold',
                                color: formData.type === 'IN' ? 'var(--income-color)' : 'var(--expense-color)'
                            }}>
                                {formData.type === 'IN' ? '수입' : '지출'}
                            </div>
                        ) : (
                            <div className="modal-radio-group">
                                <label className="radio-label">
                                    <input 
                                        type="radio" name="type" value="IN" 
                                        checked={formData.type === 'IN'} onChange={handleTypeChange} 
                                    />
                                    <span style={{color: 'var(--income-color)'}}>수입</span>
                                </label>
                                <label className="radio-label">
                                    <input 
                                        type="radio" name="type" value="OUT" 
                                        checked={formData.type === 'OUT'} onChange={handleTypeChange} 
                                    />
                                    <span style={{color: 'var(--expense-color)'}}>지출</span>
                                </label>
                            </div>
                        )}

                        <div className="modal-form">
                            <div>
                                <label className="modal-label">날짜</label>
                                <input 
                                    type="date" name="date" className="modal-input" 
                                    value={formData.date} onChange={handleChange} 
                                    readOnly={isViewMode} disabled={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="modal-label">내용</label>
                                <input 
                                    type="text" name="text" className="modal-input" 
                                    value={formData.text} onChange={handleChange} 
                                    readOnly={isViewMode}
                                />
                            </div>
                            <div>
                                <label className="modal-label">금액</label>
                                <input 
                                    type="number" name="amount" className="modal-input" 
                                    value={formData.amount} onChange={handleChange} 
                                    readOnly={isViewMode}
                                />
                            </div>
                            
                            {/* 카테고리 영역 */}
                            <div>
                                <label className="modal-label">카테고리</label>
                                {isViewMode ? (

                                    <input 
                                        type="text" name="category" className="modal-input" 
                                        value={formData.category} readOnly
                                    />
                                ) : (
                                    <select 
                                        name="category" 
                                        className="modal-input" 
                                        value={formData.category} 
                                        onChange={handleChange}
                                    >
                                        {currentCategories.map((cat, index) => (
                                            <option key={index} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="modal-label">메모</label>
                                <input 
                                    type="text" name="memo" className="modal-input" 
                                    value={formData.memo} onChange={handleChange} 
                                    readOnly={isViewMode}
                                    placeholder={isViewMode ? "" : "메모를 입력하세요"}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            {isViewMode ? (
                                <button className="modal-btn confirm" onClick={onClose} style={{width: '100%'}}>확인</button>
                            ) : (
                                <>
                                    <button className="modal-btn cancel" onClick={onClose}>취소</button>
                                    <button className="modal-btn confirm" onClick={() => onSave({ ...transaction, ...formData })}>수정</button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h3>🗑️ 삭제 확인</h3>
                        <p style={{textAlign: 'center', color: '#666', fontSize: '0.95rem', margin: '20px 0'}}>
                            <strong>"{transaction?.text}"</strong> 내역을<br/>정말 삭제하시겠습니까?
                        </p>
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={onClose}>취소</button>
                            <button className="modal-btn delete" onClick={() => onDelete(transaction.id)}>삭제</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// 메인 페이지
function MyAccountBook() {
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showIncome, setShowIncome] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 모달 관련 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('view'); 
    const [selectedItem, setSelectedItem] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    // 데이터 불러오기
    const fetchTransactions = () => {
        const userId = user?.userId || user?.USER_ID || user?.id || 1;
        
        transApi.getUserTrans(userId)
            .then(data => {
                if (!data || !Array.isArray(data)) {
                    setTransactions([]);
                    return;
                }
                const mappedData = data.map(item => {
                    const rawDate = item.transDate || item.TRANS_DATE || "";
                    let formattedDate = rawDate;
                    if (rawDate && typeof rawDate === 'string' && rawDate.includes('/')) {
                        const [yy, mm, dd] = rawDate.split('/');
                        formattedDate = `20${yy}-${mm}-${dd}`;
                    }

                    return {
                        id: item.transId || item.TRAN_ID || item.trans_id || item.id || 0,
                        text: item.title || item.TITLE,
                        amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || 0),
                        date: formattedDate,
                        type: item.type || item.TYPE,
                        category: item.category || item.CATEGORY || '기타',
                        memo: item.memo || item.MEMO || ''
                    };
                });
                setTransactions(mappedData);
            })
            .catch(error => console.error("데이터 로드 실패:", error));
    };

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    // 상세 보기 
    const openViewModal = (item) => {
        setSelectedItem(item);
        setModalType('view'); // 보기 모드
        setIsModalOpen(true);
    };

    //  수정 하기 
    const openEditModal = (e, item) => {
        e.stopPropagation(); 
        setSelectedItem(item);
        setModalType('edit'); // 수정 모드
        setIsModalOpen(true);
    };

    // 삭제 하기 
    const openDeleteModal = (e, item) => {
        e.stopPropagation(); 
        setSelectedItem(item);
        setModalType('delete'); // 삭제 모드
        setIsModalOpen(true);
    };

    // 수정 저장
    const handleSave = async (updatedData) => {
        try {
            const currentUserId = user?.userId || user?.USER_ID || user?.id;
            
            if (!currentUserId) {
                alert("로그인 정보가 없습니다.");
                return;
            }

            const updateData = {
                transId: updatedData.id,        
                title: updatedData.text,        
                transDate: updatedData.date,     
                originalAmount: Number(updatedData.amount),
                category: updatedData.category, 
                type: updatedData.type,      
                memo: updatedData.memo || '',     
                userId: Number(currentUserId),
                isShared: 'N'
            };
            
            await transApi.updateTrans(updateData);
            alert("수정되었습니다.");
            setIsModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    // 삭제 처리
    const handleDelete = async (id) => {
        try {
            await transApi.deleteTrans(id);
            alert("삭제되었습니다.");
            setIsModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    // 필터링
    const filteredTransactions = [...transactions]
       .filter((t) => {
        const matchesSearch = t.text.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesType = true;
        if (showIncome || showExpense) {
            if (showIncome && t.type?.toUpperCase() !== 'IN') matchesType = false;
            if (showExpense && t.type?.toUpperCase() !== 'OUT') matchesType = false;
        }
        
        let matchesDate = true;
        if (startDate && t.date < startDate) matchesDate = false;
        if (endDate && t.date > endDate) matchesDate = false;
        
        return matchesSearch && matchesType && matchesDate;
    });

    const handleIncomeToggle = () => {
        if (showIncome) { setShowIncome(false); } 
        else { setShowIncome(true); setShowExpense(false); }
    };

    const handleExpenseToggle = () => {
        if (showExpense) { setShowExpense(false); } 
        else { setShowExpense(true); setShowIncome(false); }
    };

    return (
        <div className="card">
            <TransactionModal 
                isOpen={isModalOpen} 
                type={modalType}
                transaction={selectedItem}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onDelete={handleDelete}
            />

            <header><h2 className="header-title">💰 나의 가계부</h2></header>

            <div className="search-wrapper">
                <div className="filter-group">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={showIncome} onChange={handleIncomeToggle} />
                        <span className="label-text income">수입</span>
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" checked={showExpense} onChange={handleExpenseToggle} />
                        <span className="label-text expense">지출</span>
                    </label>
                </div>
                <input type="text" className="search-input" placeholder="내역 검색" 
                       value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="list-header">
                <h3 className="section-title">거래 내역</h3>
                <div className="date-filter-wrapper">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="date-input" />
                    <span className="date-separator">~</span>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="date-input" />
                </div>
            </div>
            
            <div className="list-container">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t, index) => (
                        <div 
                            key={t.id || index} 
                            className="list-item" 
                            onClick={() => openViewModal(t)} 
                            style={{cursor: 'pointer'}} 
                        >
                            <div className="item-info">
                                <span className="item-text">{t.text}</span>
                                <span className="item-date">{t.date}</span>
                            </div>
                            
                            <div className="item-right">
                                <span className={`item-amount ${t.type?.toUpperCase() === 'IN' ? 'income' : 'expense'}`}>
                                    {t.type?.toUpperCase() === 'IN' ? '+' : '-'}
                                    {Math.abs(t.amount).toLocaleString()}원
                                </span>

                                <div className="item-actions">
                                    <button className="action-btn" onClick={(e) => openEditModal(e, t)}>수정</button>
                                    <button className="action-btn del-btn" onClick={(e) => openDeleteModal(e, t)}>삭제</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data">표시할 내역이 없습니다.</p>
                )}
            </div>

            <button className="add-btn" onClick={() => navigate('/mypage/expenseForm')}>새 내역 추가하기</button>
        </div>
    );
}

export default MyAccountBook;
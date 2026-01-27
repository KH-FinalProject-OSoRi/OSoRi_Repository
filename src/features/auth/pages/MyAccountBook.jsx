import React, { useState, useEffect } from 'react';
import './MyAccountBook.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import transApi from '../../../api/transApi';

// 모달페이지
const TransactionModal = ({ isOpen, type, transaction, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        text: '', amount: 0, date: '', category: '기타', memo: '', type: 'OUT'
    });

    useEffect(() => {
        if (transaction) {
            setFormData({
                text: transaction.text,
                amount: Math.abs(transaction.amount),
                date: transaction.date,
                category: transaction.category,
                memo: transaction.memo || '',
                type: transaction.type || 'OUT'
            });
        }
    }, [transaction]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {type === 'edit' ? (
                    <>
                        <h3>✏️ 내역 수정</h3>
                        
                        <div className="modal-radio-group">
                            <label className="radio-label">
                                <input 
                                    type="radio" name="type" value="IN" 
                                    checked={formData.type === 'IN'} onChange={handleChange} 
                                />
                                <span style={{color: 'var(--income-color)'}}>수입</span>
                            </label>
                            <label className="radio-label">
                                <input 
                                    type="radio" name="type" value="OUT" 
                                    checked={formData.type === 'OUT'} onChange={handleChange} 
                                />
                                <span style={{color: 'var(--expense-color)'}}>지출</span>
                            </label>
                        </div>

                        <div className="modal-form">
                            <div>
                                <label className="modal-label">날짜</label>
                                <input type="date" name="date" className="modal-input" value={formData.date} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="modal-label">내용</label>
                                <input type="text" name="text" className="modal-input" value={formData.text} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="modal-label">금액</label>
                                <input type="number" name="amount" className="modal-input" value={formData.amount} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="modal-label">메모</label>
                                <input 
                                    type="text" name="memo" className="modal-input" 
                                    value={formData.memo} onChange={handleChange} 
                                    placeholder="메모를 입력하세요"
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={onClose}>취소</button>
                            <button className="modal-btn confirm" onClick={() => onSave({ ...transaction, ...formData })}>수정</button>
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
    const [modalType, setModalType] = useState('edit'); 
    const [selectedItem, setSelectedItem] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    // 데이터 불러오기
    const fetchTransactions = () => {
        const userId = user?.userId;

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
                        id: item.transId || item.TRAN_ID,
                        text: item.title || item.TITLE,
                        amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || 0),
                        date: formattedDate,
                        type: item.type || item.TYPE,
                        category: item.category || item.CATEGORY || '기타',
                        memo: item.memo || item.MEMO || '',
                    };
                });
                setTransactions(mappedData);
            })
            .catch(error => console.error("데이터 로드 실패:", error));
    };

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    // 모달 핸들러
    const openEditModal = (item) => {
        setSelectedItem(item);
        setModalType('edit');
        setIsModalOpen(true);
    };

    const openDeleteModal = (item) => {
        setSelectedItem(item);
        setModalType('delete');
        setIsModalOpen(true);
    };

    // 수정처리
    const handleSave = async (updatedData) => {
        try{
            const userId = user?.userId;

            const updateData = {
                transId: updatedData.id,        
                title: updatedData.text,        
                transDate: updatedData.date,     
                originalAmount: Number(updatedData.amount),
                category: updatedData.category, 
                type: updatedData.type,      
                memo: updatedData.memo || '',     
                userId:userId,
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

    // 필터링 로직
    const filteredTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
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

    // 토글
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
                        <div key={t.id || index} className="list-item">
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
                                    <button className="action-btn" onClick={() => openEditModal(t)}>수정</button>
                                    <button className="action-btn del-btn" onClick={() => openDeleteModal(t)}>삭제</button>
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
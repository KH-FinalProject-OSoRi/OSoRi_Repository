import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyAccountBook.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext'; //

function MyAccountBook() {
    const [transactions, setTransactions] = useState([]);
    const { user } = useAuth(); //
    const navigate = useNavigate();

    useEffect(() => {
        const userId = user?.USER_ID || user?.id || 1; 

        axios.get(`/osori/trans/user/${userId}`) 
            .then(response => {
                console.log("DB 데이터 수신:", response.data);
                
                const mappedData = response.data.map(item => {
                    const rawDate = item.transDate || item.TRANS_DATE || ""; 
                    let formattedDate = rawDate;
                    if (rawDate && typeof rawDate === 'string' && rawDate.includes('/')) {
                        const [yy, mm, dd] = rawDate.split('/');
                        formattedDate = `20${yy}-${mm}-${dd}`;
                    }

                    return {
                        id: item.tranId || item.TRAN_ID, //
                        text: item.title || item.TITLE, //
                        amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || 0), 
                        date: formattedDate,
                        type: item.type || item.TYPE,
                        category: item.category || item.CATEGORY || '기타'
                    };
                });
                setTransactions(mappedData);
            })
            .catch(error => console.error("데이터 로드 실패 (404 여부 확인):", error));
    }, [user]);

    const income = transactions
        .filter(t => t.type?.toUpperCase() === 'IN')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.type?.toUpperCase() === 'OUT')
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const total = income - expense;

    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    return (
        <div className="card">
            <header><h2 style={{ marginBottom: '20px' }}>💰 나의 가계부</h2></header>
            <div className="balance-section">
                <h4 className="balance-title">현재 잔액</h4>
                <h1 className="balance-amount">{total.toLocaleString()}원</h1>
            </div>
            <h3 style={{ textAlign: 'left', margin: '20px auto 15px', maxWidth: '650px' }}>최근 내역</h3>

            <div className="list-container">
                {recentTransactions.length > 0 ? (
                    recentTransactions.map((t) => (
                        <div key={t.id} className={`list-item ${t.type?.toUpperCase() === 'IN' ? 'plus' : 'minus'}`}>
                            <div className="item-info">
                                <span className="item-text" style={{ fontWeight: '600', display: 'block' }}>{t.text}</span>
                                <span className="item-date" style={{ fontSize: '0.85rem', color: '#888' }}>{t.date}</span>
                            </div>
                            
                            <span className={`item-amount ${t.type?.toUpperCase() === 'IN' ? 'income' : 'expense'}`}>
                                {t.type?.toUpperCase() === 'IN' ? '+' : '-'}
                                {Math.abs(t.amount).toLocaleString()}원
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="no-data" style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                        표시할 최근 내역이 없습니다.
                    </p>
                )}
            </div>
            <button className="add-btn" onClick={() => navigate('/mypage/expenseForm')}>새 내역 추가하기</button>
        </div>
    );
}

export default MyAccountBook;
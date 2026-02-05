import React, { useEffect, useMemo, useState } from "react";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import { fixedTransApi } from "../../../api/fixedTransApi";
import FixedTransModal from "./FixedTransModal";
import "./FixedTransPage.css";

export default function FixedTransPage() {
  const { user } = useAuth();
  const userId = user?.userId;

  const displayName = useMemo(() => {
    return user?.nickName || user?.nickname || user?.userName || user?.loginId || "회원";
  }, [user]);

  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // 수정 대상

  const fetchList = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await fixedTransApi.list(userId);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("고정지출 목록 조회 실패");
      setList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [userId]);

  const openCreate = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setIsModalOpen(true);
  };

  const removeOne = async (fixedId) => {
    const ok = window.confirm("삭제함? (삭제하면 자동등록도 당연히 안 됨)");
    if (!ok) return;

    try {
      await fixedTransApi.remove(fixedId);
      alert("삭제 완료");
      fetchList();
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  return (
    <main className="fade-in">
      <header className="content-header">
        <h2>고정지출</h2>
        <p className="welcome-text">{displayName} 님 고정지출 관리하는 곳</p>
      </header>

      {/* 목록 */}
      <div className="account-book-grid">
        <div className="info-card" style={{ gridColumn: "1 / -1", paddingTop:'10px'}}>
          <button type="button" className="ftAddBtn" onClick={openCreate}>
            <span className="ftAddIcon" aria-hidden="true">＋</span>
            <span>고정지출 추가</span>
          </button>
          <div className="card-title-area" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>📄 내 고정지출 목록</h3>
            <span className="status-dot">{list.length}개</span>
          </div>

          {isLoading ? (
            <p className="desc" style={{ marginTop: 16 }}>불러오는 중...</p>
          ) : list.length === 0 ? (
            <p className="desc" style={{ marginTop: 16 }}>등록된 고정지출 없음. 우측 상단에서 추가하면 됨</p>
          ) : (
            <div className="ftList">
              {list.map((item) => (
                <div key={item.fixedId} className="ftRow">
                  <div className="ftRowMain">
                    <div className="ftRowName">
                      <span aria-hidden="true">🧾</span>
                      <span className="ftName">{item.name}</span>
                      <span className="status-dot">매달 {item.payDay}일</span>
                    </div>

                    <div className="ftRowSub">
                      <span>카테고리: {item.category}</span>
                      {item.transDate && <span>등록일: {String(item.transDate).slice(0, 10)}</span>}
                    </div>
                  </div>

                  <div className="ftAmount">{Number(item.amount).toLocaleString()}원</div>

                  <div className="ftRowActions">
                    <button type="button" className="ftBtn ftBtnEdit" onClick={() => openEdit(item)}>
                      수정
                    </button>
                    <button type="button" className="ftBtn ftBtnDelete" onClick={() => removeOne(item.fixedId)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

          )}
        </div>
      </div>

      {/* 모달 */}
      {isModalOpen && (
        <FixedTransModal
          userId={userId}
          mode={editTarget ? "edit" : "create"}
          initialValue={editTarget}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchList}
        />
      )}
    </main>
  );
}

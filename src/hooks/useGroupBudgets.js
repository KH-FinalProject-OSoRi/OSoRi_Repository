import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { groupBudgetApi } from "../api/groupBudgetApi"; // 경로 확인 필요

export const useGroupBudgets = (userId) => {
  const [groupBudgetList, setGroupBudgetList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  

  const fetchGroupBudgetList = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const data = await groupBudgetApi.groupBudgetList(userId);
      setGroupBudgetList(data);
      return data; // 성공 시 데이터 반환
    } catch (error) {
      console.error("그룹가계부 목록 조회 실패", error);
      alert("그룹가계부 목록을 조회할 수 없습니다.");
      navigate("/mypage");
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) {
      fetchGroupBudgetList();
    }
  }, [userId, fetchGroupBudgetList]);

  return { 
    groupBudgetList, 
    setGroupBudgetList, // 직접 상태 수정이 필요한 경우(예: 추가/삭제 후 수동 업데이트)
    isLoading, 
    fetchGroupBudgetList 
  };
};
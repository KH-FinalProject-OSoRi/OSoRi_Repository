import { useEffect,useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GroupBookGuard = ({ groupList, children, isLoading }) => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const navigate = useNavigate();

  useEffect(()=>{
    //그룹 리스트가 존재할 때 검증
    if (!isLoading && groupList && groupList.length > 0) {
      const foundGroup = groupList.find(g=> String(g.groupbId) === String(groupId));
  
      if (!foundGroup || foundGroup.status === 'N') {
        navigate("/not-found",{replace:true}); //true는 뒤로가기 했을때 오류 페이지로 안감
      }
    }
  },[isLoading,groupList,groupId,navigate]);

  if (isLoading || !groupList) return <div>권한 확인 중...</div>; 

  const hasAccess = groupList.some(g => String(g.groupbId) === String(groupId));
  
  //검증 전까지 children 반환 금지
  return  hasAccess ? children:null;
};

export default GroupBookGuard;
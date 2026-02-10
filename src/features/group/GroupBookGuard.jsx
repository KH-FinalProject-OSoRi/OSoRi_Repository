import { useEffect,useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GroupBookGuard = ({ groupList, children, isLoading }) => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const navigate = useNavigate();
  //검증용
  const [targetGroup, setTargetGroup] = useState(null); 

  useEffect(()=>{
    if (!isLoading && groupList) {
      const foundGroup = groupList.find(g=> String(g.groupbId) === String(groupId));
  
      if (!foundGroup || foundGroup.status === 'N') {
        alert("삭제되었거나 존재하지 않는 가계부입니다.");
        navigate("/mypage",{replace:true});
      }else{
        setTargetGroup(foundGroup);
      }
    }
  },[isLoading,groupList,groupId,navigate]);

  if (isLoading || !groupList || groupList.length === 0) return null;
  
  //검증 전까지 children 반환 금지
  return children;
};

export default GroupBookGuard;
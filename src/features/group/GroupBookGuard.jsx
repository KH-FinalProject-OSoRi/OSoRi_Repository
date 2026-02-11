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
        navigate("/not-found",{replace:true}); //true는 뒤로가기 했을때 오류 페이지로 안감
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
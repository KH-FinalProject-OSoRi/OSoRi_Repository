import { useEffect,useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PulseLoader } from 'react-spinners';

const GroupBookGuard = ({ groupList, children, isLoading }) => {
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 700);

    return () => clearTimeout(timer); // 언마운트 시 타이머 정리
  }, []);

  useEffect(()=>{
    //그룹 리스트가 존재할 때 검증
    if (!isLoading && groupList && groupList.length > 0) {
      const foundGroup = groupList.find(g=> String(g.groupbId) === String(groupId));
  
      if (!foundGroup || foundGroup.status === 'N') {
        navigate("/not-found",{replace:true}); //true는 뒤로가기 했을때 오류 페이지로 안감
      }
    }
  },[isLoading,groupList,groupId,navigate]);

  if (isLoading || showLoader || !groupList) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}>
        <PulseLoader
          color="#0066ff"
          loading={true}
          margin={20}
          size={15}
        />
      </div>
    );
  }

  const hasAccess = groupList.some(g => String(g.groupbId) === String(groupId));
  
  //검증 전까지 children 반환 금지
  return  hasAccess ? children:null;
};

export default GroupBookGuard;
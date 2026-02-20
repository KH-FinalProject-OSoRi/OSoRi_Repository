import { useNavigate } from "react-router-dom";
import { groupBudgetApi } from "../../api/groupBudgetApi";
import { useState,useEffect,useRef } from "react";
import './AddGroupBudgetModal.css'
import { NavLink } from "react-router-dom";

const OldGroupBudgetModal=({userId,onClose,onSuccess})=>{
    const [groupOldBudgetList,setGroupOldBudgetList] =useState([]);
    const navigate = useNavigate();
    const [isLoading,setIsLoading] = useState(true);
    const overlayRef = useRef(null);

    //모달창 바깥쪽 클릭 이벤트 리스너
    window.addEventListener('click',(e)=>{
        console.log(e.target == overlayRef.current);
        e.target == overlayRef.current ? onClose() : false;
    });

    //이전 그룹 가계부 리스트 호출
    const fetchOldGroupBudgetList = async()=>{
        if (!userId) return;
        setIsLoading(true);
        try{
            const data = await groupBudgetApi.oldGroupBudgetList(userId);

            setGroupOldBudgetList(data);
        }catch(error){
            console.error('이전 그룹가계부 목록 조회 실패',error);
            alert('이전 그룹가계부 목록을 조회할 수 없습니다.');
            navigate('/mypage');    
        }finally{
            setIsLoading(false);
        }
    }

    useEffect(()=>{
        fetchOldGroupBudgetList();
    },[]);

    return(
        <div className="modalOverlayStyle" ref={overlayRef}>
            <div className="modalContentStyle" style={{height: 'auto', overflow: 'hidden', flexDirection: 'column', display: 'flex'}}>
                <h3>이전 그룹가계부 목록</h3>
                <div className="account-detail2">
                    <ul className="sidebar-menu">
                        {groupOldBudgetList.length === 0 &&
                            <li style={{paddingBottom:'20px'}}>
                            이전 가계부가 없습니다.
                            </li>
                        }

                        {groupOldBudgetList &&
                            groupOldBudgetList.map((gb)=>(
                            <li key={gb.groupbId}>
                                <NavLink
                                to={{
                                        pathname: "/mypage/groupAccountBook",
                                        search: `?groupId=${gb?.groupbId}`,
                                    }}
                                className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
                                >
                                <span>🪙</span> {gb.title} 가계부
                                ({gb.startDate}~{gb.endDate})
                                </NavLink>
                            </li>
                            ))
                        }
                    </ul>
                </div>

                <div className="buttonGroup formStyle">
                    <button type="button" style={{display:"block", alignItems:"center", marginTop:"20px"}} onClick={onClose}>나가기</button>
                </div>
            </div>
        </div>
    );
}
export default OldGroupBudgetModal;
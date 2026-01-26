import { useNavigate } from 'react-router-dom';
import {useState,useEffect} from 'react';
import { groupBudgetApi } from '../../api/groupBudgetApi';
import './AddGroupBudgetModal.css'
import { useAuth } from '../../context/AuthContext';

const AddGroupBudgetModal=({userId,onClose,onSuccess})=>{
    const [isLoading,setIsLoading] =useState(false);
    const [isbAmount,setIsbAmount] = useState(false);
    const navigate = useNavigate();
    const [searchKeyword,setSearchKeyword] = useState('');
    const [memList, setMemList] = useState([]);
    const [selectedMemList, setSelectedMemList] = useState([]);

    const [formData,setFormData] = useState({
        title:'',
        bAmount:0,
        startDate:'',
        endDate:''
    });

    const handleChange = (e)=>{
        const {name,value}=e.target;
        setFormData((prev)=>({
            ...prev,
            [name]:value
        }));
    };

    //검색어로 이메일 뽑아오기
    const fetchMemList = async()=>{
        try{
            const data = await groupBudgetApi.searchMem(searchKeyword);

            setMemList(Array.isArray(data) ? data : []);
            setMemList(prev=>prev.filter(mem=>mem.userId !== userId));
        }catch(error){
            console.error('회원 리스트 목록 조회 실패',error);
        }
    };

    useEffect(()=>{
        const timer = setTimeout(() => {
            if (searchKeyword.trim().length >= 2) { // 2글자 이상일 때만 호출
                fetchMemList();
            } else {
                setMemList([]); // 검색어가 짧으면 리스트 비우기
            }
        }, 300);

        return () => clearTimeout(timer);
    },[searchKeyword]);

    //추가 멤버들 핸들러
    const handleSelectMember=(user)=>{
        const isAlreadySelected = selectedMemList.some(mem=>mem.userId === user.userId);

        if(isAlreadySelected){
            alert("이미 추가된 회원입니다.");
            return;
        }

        setSelectedMemList(prev => [...prev, user]);
    
        // 선택 후 검색어 초기화 (옵션)
        setSearchKeyword("");
        setMemList([]); 
    }

    //선택 취소 핸들러
    const handleDeleteSelectMem=(delMemId)=>{
        setSelectedMemList(prev=>prev.filter(mem=>mem.userId !== delMemId));
    }

    const handleSubmit=async(e)=>{
        e.preventDefault();

        if(!formData.title.trim()){
            alert('그룹가계부 이름을 입력해주세요.');
            return;
        }

        if(formData.startDate >= formData.endDate){
            alert('시작 날짜는 종료 날짜보다 이전이여야 합니다.');
            return;
        }

        setIsLoading(true);

        try{
            const submitData = new FormData();
            submitData.append('userId',userId);
            submitData.append('title',formData.title);
            submitData.append('bAmount',formData.bAmount);
            submitData.append('startDate',formData.startDate);
            submitData.append('endDate',formData.endDate);

            //새로 생성된 그룹가계부
            const newGroup = await groupBudgetApi.create(submitData);

            if(newGroup && newGroup.groupbId){
                const addMemPromise = selectedMemList.map(mem=>{
                    return groupBudgetApi.addMemList({
                        groupbId: newGroup.groupbId,
                        userId: mem.userId,
                        role:'MEMBER'
                    });
                });

                await Promise.all(addMemPromise);

                alert("그룹가계부와 멤버 추가에 성공했습니다!");
                onSuccess();
                navigate('/mypage');
            }
        }catch(error){
            console.error('그룹가계부 추가 실패'+error);
            alert('그룹가계부 추가에 실패했습니다');
        }finally{
            setIsLoading(false);
        }
    }

    return(
        <div className="modalOverlayStyle">
            <div className="modalContentStyle">
                <h3>새로운 그룹가계부 추가</h3>
                <form onSubmit={handleSubmit} className="formStyle">
                    <label htmlFor="title">그룹가계부 이름</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="이름" required/>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="checkBox" 
                               name="isbAmount" 
                               id="isbAmount" 
                               checked={isbAmount} 
                               onChange={(e)=>setIsbAmount(e.target.checked)}/>
                        <label htmlFor="isbAmount" style={{margin: 0}}>예산 설정하기</label>
                    </div>
                    <input type="number" 
                           placeholder="예산 금액 설정" 
                           name="bAmount" value={formData.bAmount} 
                           onChange={handleChange} 
                           disabled={!isbAmount}
                           style={{ backgroundColor: !isbAmount ? '#f5f5f5' : 'white' }}
                    />
                    
                    <label htmlFor="startDate">시작일</label>
                    <input type="date" id="startDate" required name="startDate" value={formData.startDate} onChange={handleChange} />
                    <label htmlFor="endDate">종료일</label>
                    <input type="date" id="endDate" required name="endDate" value={formData.endDate} onChange={handleChange} />

                    <label htmlFor="memList">회원 추가</label>
                    <input type="text" 
                           name="search" 
                           placeholder='검색할 이메일을 입력해주세요.' 
                           value={searchKeyword} 
                           onChange={(e)=>setSearchKeyword(e.target.value)}>
                    </input>
                    {memList.length > 0 && (
                        <ul>
                            {memList.map((mem)=>(
                                <li key={mem.userId} onClick={()=>handleSelectMember(mem)}>
                                    {mem.email} ({mem.loginId}) <span>[추가]</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="selected-members">
                        <h4>선택된 멤버:</h4>
                        {selectedMemList.map((mem) => (
                            <span key={mem.userId} className="member-badge">
                                {mem.loginId} 
                                <button onClick={() => handleDeleteSelectMem(mem.userId)}>x</button>
                            </span>
                        ))}
                    </div>

                    <div className="buttonGroup">
                        <button type="submit">저장</button>
                        <button type="button" onClick={onClose}>취소</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddGroupBudgetModal;
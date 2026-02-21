import api from "./axios";

export const groupBudgetApi={
    //그룹가계부 목록 불러오기
    groupBudgetList: async(userId)=>{
        const response = await api.get(`/group/gbList`,{
            params:{userId}
        });
        return response.data;
    },
    //이전 그룹 가계부 생성
    oldGroupBudgetList:async(userId)=>{
        const response = await api.get(`/group/gbOldList`,{
            params:{userId}
        });
        return response.data;
    },
    //그룹가계부 새로 생성
    create:async(groupBudget)=>{
        const response = await api.post('/group/gbAdd',groupBudget);
        return response.data;
    },
    //회원 목록 불러오기
    searchMem:async(keyword)=>{
        const response = await api.get('/group/searchMem',{
            params:{keyword:keyword}
        });
        return response.data;
    },
    //현재 그룹 가계부 회원 목록 불러오기
    currentMem:async(groupId)=>{
        const response = await api.get('/group/currentMem',{
            params:{groupId}
        });
        return response.data;
    },
    //그룹 가계부 멤버 추가
    addMemList:async(user)=>{
        const response = await api.post('/group/gbAddMem',user);
        return response.data;
    },
    //그룹 가계부 멤버 삭제
    deleteMemList:async(user)=>{
        const response = await api.post('/group/deleteMemList',user);
        console.log(response.data);
        return response.data;
    },
    //초대 상태 변경
    updateNotiStatus:async(params)=>{
        const response = await api.post('/group/gbInviteNoti',params);
        return response.data;
    },
    //안읽은 알림 목록 불러오기
    notiList:async(loginId)=>{
        const response = await api.get('/group/gbNotiList',{
            params:{loginId}
        });
        return response.data;
    },
    //알림 읽음 처리
    updateNotiIsRead:async(readNotiId)=>{
        const response = await api.put('/group/gbIsRead',null,{
            params:{notiId: readNotiId}
        });
        return response.data;
    },
    //그룹가계부 관리자 확인
    checkAdmin:async(groupbId)=>{
        const response = await api.get(`/group/gbCheckAdmin`,{
            params:{groupbId}
        });
        return response.data;
    },
    //그룹가계부 수정
    updateGroupB:async(gb)=>{
        const response = await api.post('/group/gbUpdate',gb);
        return response.data;
    },
    //그룹가계부 삭제
    deleteGroupB:async(groupbId)=>{
        const response= await api.post(`/group/gbDelete?groupbId=${groupbId}`);
        return response.data;
    },
    groupChallList:async()=>{
        const response = await api.get('/group/gbChallList');
        return response.data;
    },
    addGroupChallList:async(chall)=>{
        const response = await api.post('/group/gbAddChall',chall);
        return response.data;
    },
    fetchGroupBudgetAll:async(userId)=>{
        const response = await api.get(`/group/gbAll`,{
            params:{userId}
        });
        return response.data;
    }

}

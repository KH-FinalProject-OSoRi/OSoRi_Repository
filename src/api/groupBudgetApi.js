import api from "./axios";

export const groupBudgetApi={
    //그룹가계부 목록 불러오기
    groupBudgetList: async(userId)=>{
        console.log("userId ",userId);
        const response = await api.get(`/group/gbList`,{
            params:{userId}
        });
        console.log("response ",response);
        return response.data;
    },
    //그룹가계부 새로 생성
    create:async(groupBudget)=>{
        const response = await api.post('/group/gbAdd',groupBudget);
        return response.data;
    },
    //회원 리스트 불러오기
    searchMem:async(keyword)=>{
        const response = await api.get('/group/searchMem',{
            params:{keyword:keyword}
        });
        return response.data;
    },
    addMemList:async(user)=>{
        const response = await api.post('/group/gbAddMem',user);
        console.log(response);
        return response.data;
    },
    updateNotiStatus:async(params)=>{
        console.log(params);
        const response = await api.post('/group/gbInviteNoti',params);
        return response.data;
    },
    notiList:async(loginId)=>{
        const response = await api.get('/group/gbNotiList',{
            params:{loginId}
        });
        return response.data;
    },
    updateNotiIsRead:async(readNotiId)=>{
        const response = await api.put('/group/gbIsRead',null,{
            params:{notiId: readNotiId}
        });
        console.log(response);
        return response.data;
    }
}
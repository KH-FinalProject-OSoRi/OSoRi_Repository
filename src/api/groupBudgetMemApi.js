import api from "./axios";



export const groupBudgetMemApi ={
    //그룹 멤버 불러오기 
    searchGroupMem : async(groupId) =>{
        const response = await api.get(`/groupMem/searchGroupMem/${groupId}`);
        return response.data;
    }

}

export default groupBudgetMemApi;
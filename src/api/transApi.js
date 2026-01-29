import api from "./axios";

export const transApi = {

    receiptAnalyze : async(serverFormData) =>{
        const response = await api.post('/api/ocr',serverFormData,{
             headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        return response.data;
    },

    myTransSave : async(formData) =>{
        const response = await api.post('/trans/myTransSave',formData);

        return response.data;
    },

    getUserTrans: async (userId) => {
        const response = await api.get(`/trans/user/${userId}`);
        return response.data;
    },

    groupTransSave : async(formData) =>{
        const response = await api.post('/trans/groupTransSave',formData);
        return response.data;
    },

    getGroupTrans: async (groupId) => {
        const response = await api.get(`/trans/groupTransList/${groupId}`);
        return response.data;
    },

    updateTrans: async (updateData) =>{
        const response = await api.put('/trans/updateTrans', updateData);
        return response.data;
    },

    deleteTrans: async (transId) => {
        const response = await api.delete(`/trans/deleteTrans/${transId}`);
        return response.data;
    },

     updateGroupTrans: async (updateData) =>{
        const response = await api.put('/trans/updateGroupTrans', updateData);
        return response.data;
    },

    deleteGroupTrans: async (transId) => {
        const response = await api.delete(`/trans/deleteGroupTrans/${transId}`);
        return response.data;
    },

    groupInfo: async (groupId) => {
        const response = await api.get(`/trans/groupInfo/${groupId}`);
        return response.data;
    },

    recentTrans: async (userId) =>{
        const response = await api.get(`/trans/recentTrans/${userId}`);
        return response.data;
    }
}

export default transApi;
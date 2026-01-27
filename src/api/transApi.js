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

    groupTransSave : async(formData) =>{
        const response = await api.post('/trans/groupTransSave',formData);

        return response.data;
    },

    getUserTrans: async (userId) => {
        const response = await api.get(`/trans/user/${userId}`);
        return response.data;
    },

    updateTrans: async (updatedData) =>{
        const response = await api.update()
    }
}

export default transApi;
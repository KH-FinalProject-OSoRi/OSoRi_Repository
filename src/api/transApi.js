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
    }

}

export default transApi;
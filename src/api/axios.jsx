import axios from "axios";

const api = axios.create({
    baseURL : 'http://13.239.33.140:8080',
    timeout : 10000,
    headers : {
        'Content-Type' : 'application/json'
    }
});

export default api; 
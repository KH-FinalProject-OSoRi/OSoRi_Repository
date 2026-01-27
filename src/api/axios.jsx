import axios from "axios";

const api = axios.create({

    baseURL : '/osori',
    timeout : 10000,
    headers : {
        'Content-Type' : 'application/json'
    }

});

export default api; 

// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:8080/osori", 
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export default api;
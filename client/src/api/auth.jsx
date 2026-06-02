import axios from "axios";
import { data } from "react-router-dom";

export const currentUser = async (token) => await axios.post('http://localhost:8000/api/current-user',{},{
    headers : {
        Authorization : `Bearer ${token}`
    }
})

export const currentAdmin = async (token) =>{
    return  await axios.post('http://localhost:8000/api/current-admin',{},{
        headers : {
            Authorization : `Bearer ${token}`
        }
    })
}


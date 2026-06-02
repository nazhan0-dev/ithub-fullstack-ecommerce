import axios from "axios";

export const uploadFiles = async (token , form) =>{
    //  console.log('form api fronent',form)
     return axios.post('http://localhost:8000/api/images',{
        image : form
     },{
        headers : {
            Authorization : `Bearer ${token}`
        }
    })
}
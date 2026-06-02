import axios from "axios";

export const removeFiles = async (token , public_id) =>{
    //  console.log('form api fronent',form)
     return axios.post('http://localhost:8000/api/removeimages',{
        public_id
     },{
        headers : {
            Authorization : `Bearer ${token}`
        }
    })
} 
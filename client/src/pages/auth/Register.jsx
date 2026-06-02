import axios from "axios";
import React , {useState}from "react";
  import { toast } from 'react-toastify';
const Register = () => {
  // js
  const [form , setForm] =useState({
       email : "",
       password : "",
       confirmpassword : ""
  })

  const hadleOnChange = (e) =>{
     setForm({
        // popy object ด้านบน
      ...form,
      [e.target.name]: e.target.value
     })
  }
  const hadleSubmit = async (e) =>{
     e.preventDefault()
     if(form.password !== form.confirmpassword){
      return alert('Confirm Passworrd is not match !!!')
     }
     console.log(form)
    // send to back
    try {
      const res = await axios.post('http://localhost:8000/api/register',form)
      console.log(res.data)
      toast.success(res.data)
    } catch (error) {
      const errMsg = error.response?.data?.message
      toast.error(errMsg)
      console.log(error)
    }  
  }


  return (
    <div>
      register
            <form onSubmit={hadleSubmit}>


              Email
                <input className="border" 
                  onChange={hadleOnChange}
                  name="email" 
                  type="email"
                />
              
              Password 
              <input className = "border"
                onChange={hadleOnChange}
                name="password" 
                type="text"
               />

              Confirm Password
              <input className = "border"
                onChange={hadleOnChange}
                name="confirmpassword" 
                type="text"
               />

               <button className="bg-blue-500 rounded-md"
               >Register
               </button>

                
            </form>
    </div>
  );
};

export default Register;

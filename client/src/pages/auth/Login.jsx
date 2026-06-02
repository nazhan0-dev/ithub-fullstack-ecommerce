import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import useEcomStore from "../../store/econ-store";
import { useNavigate } from "react-router-dom";



const Login = () => {
  // js
  const navigate = useNavigate()
  const actionLogin = useEcomStore((state)=>state.actionLogin)
  const user = useEcomStore((state)=>state.user)
  console.log('user form zustand',user)
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const hadleOnChange = (e) => {
    setForm({
      // popy object ด้านบน
      ...form,
      [e.target.name]: e.target.value,
    });
  };
  const hadleSubmit = async (e) => {
    e.preventDefault();
     try {
       const res = await actionLogin(form)
       const role = res.data.payload.role 
       roleRedirect(role)
       toast.success('Welcome Back')
     } catch (error) {
       console.log(error)
       const errMsg = error.response?.data?.message
       toast.error(errMsg)
     }
  };
  const roleRedirect = (role) =>{
    if(role === 'admin'){
      navigate('/admin')
    }else{
      navigate('/user')
    }
  }

  return (
    <div>
      Login
      <form onSubmit={hadleSubmit}>
        Email
        <input
          className="border"
          onChange={hadleOnChange}
          name="email"
          type="email"
        />
        Password
        <input
          className="border"
          onChange={hadleOnChange}
          name="password"
          type="text"
        />
        <button className="bg-blue-500 rounded-md">Login</button>
      </form>
    </div>
  );
};

export default Login;

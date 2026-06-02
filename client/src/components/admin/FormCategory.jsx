import React, { useState, useEffect } from "react";
import { createCategory, listCategory , removeCategory} from "../../api/Category";
import useEcomStore from "../../store/econ-store";
import { toast } from "react-toastify";
import { Trash2 , CirclePlus} from 'lucide-react';

const FormCategory = () => {
  //  Js
  const token = useEcomStore((state) => state.token);
  const [name, setName] = useState("");
  // const [category, setCategory] = useState([]);
  // import categories จาก zutane gobla state
  const categories = useEcomStore((state)=>state.categories)
  // เรียกใช้ getcategory ที่  gobalsatate store (zutane)
  const getCategory = useEcomStore((state)=>state.getCategory)

  useEffect(() => {

    getCategory(token);

  }, []);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      return toast.warning("Please fill data");
    }
    try {
      const res = await createCategory(token, { name });
      console.log(res.data.name);
      toast.success(`Add Category ${res.data.name} success !!`);
      getCategory(token)
    } catch (error) {
      console.log(error);
    }
  };
  
  const handleRemove = async (id) => {
     console.log(id)
     try {
       const res = await removeCategory(token,id)
       console.log(res)
       getCategory(token)
       toast.success(`Deleted ${res.data.name} success`)
     } catch (error) {
      console.log(error)
     }
  }
  return (
    <div className="container mx-auto p-4 bg-white shadow-md">
      <h1>Category Management</h1>
      <form 
      onSubmit={handleSubmit} 
      className="my-4">
        <input
          onChange={(e) => setName(e.target.value)}
          className="border"
          type="text"
        />
        <button className="m-2 text-green-500 flex items-center gap-2">
          <CirclePlus /> Add Category
          </button>
      </form>
      <hr />


      <ul 
         className="list-none">
          {
            categories.map((item, index) => (
             <li 
               className="flex justify-between my-2" 
               key={index}>
                 <span className="text-gray-800">{index + 1}.</span>
                 <span>
                    {item.name}
                 </span>

                     <button
                       className="text-red-600 font-bold"
                       onClick={()=>handleRemove(item.id)}
                      >
              
                           <Trash2 /> 
              
                    </button>
             </li>
        ))}
      </ul>

    </div>
  );
};

export default FormCategory;

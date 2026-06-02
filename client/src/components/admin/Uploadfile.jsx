import React, { useState } from "react";
import { toast } from "react-toastify";
import { uploadFiles } from "../../api/uploadfile";
import Resizer from "react-image-file-resizer";
import useEcomStore from "../../store/econ-store";

const Uploadfile = ({ form, setForm }) => {
  // js
  const token = useEcomStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnChange = (e) => {
    const files = e.target.files;
    if (files) {
      setIsLoading(true);
      //[] empty array
      let allFiles = form.images;
      for (let i = 0; i < files.length; i++) {
        // console.log(files[i]);

        //   validate
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          toast.error(`File ${file.name} Not photo`);
          continue;
        }
        // image Resize
        Resizer.default.imageFileResizer(
          files[i],
          720,
          720,
          "JPEG",
          100,
          0,
          (data) => {
            // endpoint backend
            uploadFiles(token, data)
              .then((res) => {
                console.log(res);
                allFiles.push(res.data);
                setForm({
                  ...form,
                  images: allFiles,
                });
                toast.success("Upload Image Success !!");
              })
              .catch((err) => {
                console.log(err);
              });
          },
          "base64",
        );
      }
    }
  };
  console.log(form);
  const handleDelete = (public_id) =>{
    console.log(public_id)
  }
  return (
    <div className="my-4">
      <div className="flex mx-4 gap-4 my-4">
        {/* image */}

        {form.images.map((item, index) => (
          <div className="relative">
              <img className="w-24 h-24 hover:scale-105" 
                   src={item.url} />
              <span 
                 onClick={()=>handleDelete(item.public_id)}
                 className="absolute top-0 right-0 text-red-800 font-bold">X</span>
          </div>
        ))}
      </div>

      <div>
        <input onChange={handleOnChange} type="file" name="images" multiple />
      </div>
    </div>
  );
};

export default Uploadfile;

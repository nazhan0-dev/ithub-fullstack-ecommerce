import { useState } from "react";
import { toast } from "react-toastify";
import Resizer from "react-image-file-resizer";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadFiles } from "../../api/uploadfile";
import { removeFiles } from "../../api/removefile";

// react-image-file-resizer เป็น CJS -> บางครั้งอยู่ใน .default
const resizer = Resizer.default || Resizer;

const resizeImage = (file) =>
  new Promise((resolve) => {
    resizer.imageFileResizer(file, 720, 720, "JPEG", 100, 0, resolve, "base64");
  });

const Uploadfile = ({ form, setForm }) => {
  const [uploading, setUploading] = useState(0);

  const handleOnChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้

    const images = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
        return false;
      }
      return true;
    });

    setUploading((n) => n + images.length);
    await Promise.all(
      images.map(async (file) => {
        try {
          const data = await resizeImage(file);
          const res = await uploadFiles(data);
          // ใช้ functional update เพื่อไม่ให้รูปที่อัปโหลดพร้อมกันทับกัน
          setForm((prev) => ({ ...prev, images: [...prev.images, res.data] }));
        } catch (err) {
          console.log(err);
          toast.error(`อัปโหลด ${file.name} ไม่สำเร็จ`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (images.length > 0) toast.success("อัปโหลดรูปภาพเรียบร้อย");
  };

  const handleDelete = (public_id) => {
    removeFiles(public_id)
      .then(() => {
        setForm((prev) => ({
          ...prev,
          images: prev.images.filter((item) => item.public_id !== public_id),
        }));
        toast.info("ลบรูปภาพแล้ว");
      })
      .catch((err) => {
        console.log(err);
        toast.error("ลบรูปภาพไม่สำเร็จ");
      });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {form.images.map((item) => (
        <div key={item.public_id} className="group relative size-24 overflow-hidden rounded-xl border bg-white">
          <img src={item.url} alt="" className="h-full w-full object-contain p-1" />
          <button
            type="button"
            onClick={() => handleDelete(item.public_id)}
            aria-label="ลบรูป"
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-destructive shadow opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {Array.from({ length: uploading }).map((_, i) => (
        <div key={`up-${i}`} className="flex size-24 items-center justify-center rounded-xl border bg-muted/40">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ))}

      <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
        <ImagePlus size={22} />
        เพิ่มรูป
        <input onChange={handleOnChange} type="file" accept="image/*" multiple className="hidden" />
      </label>
    </div>
  );
};

export default Uploadfile;

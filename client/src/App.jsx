import AppRouter from "./routes/AppRouter";
import { ToastContainer, cssTransition } from "react-toastify";
import SplashIntro from "./components/SplashIntro";

// แจ้งเตือนพุ่งเข้าจากขวาแล้วเด้งเข้าที่ / เลื่อนออกพร้อมจางหาย (keyframes อยู่ใน index.css)
const ToastMotion = cssTransition({ enter: "toast-in", exit: "toast-out", collapseDuration: 250 });

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} theme="light" transition={ToastMotion} newestOnTop />
      <AppRouter />
      <SplashIntro />
    </>
  );
};

export default App;

import AppRouter from "./routes/AppRouter";
import { ToastContainer } from "react-toastify";
import SplashIntro from "./components/SplashIntro";

const App = () => {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} theme="light" />
      <AppRouter />
      <SplashIntro />
    </>
  );
};

export default App;

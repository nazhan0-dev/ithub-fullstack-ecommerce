import AppRouter from "./routes/AppRouter";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <>
      <ToastContainer position="bottom-right" autoClose={2500} theme="light" />
      <AppRouter />
    </>
  );
};

export default App;

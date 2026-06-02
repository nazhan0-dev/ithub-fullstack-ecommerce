import React from "react";
import AppRouter from "./routes/AppRouter";
import { ToastContainer, toast } from "react-toastify";

const App = () => {
  // js

  return (
    <>
    <ToastContainer/>
      <AppRouter />
    </>
  );
};

export default App;

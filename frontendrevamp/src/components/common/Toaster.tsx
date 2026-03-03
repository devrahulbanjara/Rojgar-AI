"use client";

import { ToastContainer } from "react-toastify";

/**
 * Global toast container — mounted once in the root layout.
 * Call toast.success / toast.error / toast.info anywhere in the app.
 */
export default function Toaster() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  );
}

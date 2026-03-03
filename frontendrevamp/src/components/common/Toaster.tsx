"use client";

import { ToastContainer } from "react-toastify";

/**
 * Global toast container — mounted once in the root layout.
 * Call toast.success / toast.error / toast.info anywhere in the app.
 */
export default function Toaster() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastStyle={{ backgroundColor: "#ffffff", color: "#111827" }}
    />
  );
}

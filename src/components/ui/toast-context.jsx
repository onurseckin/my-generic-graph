import React, { createContext, useContext, useState } from "react";
import { Toast, ToastProvider, ToastViewport, ToastClose } from "./toast";

const ToastContext = createContext({});

export function ToastContextProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant = "default") => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastProvider>
        {children}
        {toasts.map((toast) => (
          <Toast key={toast.id} variant={toast.variant}>
            {toast.message}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// app/component/AppWrapper.jsx
"use client";

import { useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import Header from "./Header";
import LoginPage from "./LoginPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AppWrapper({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <CartProvider>
      <Header />
      <main className="p-6">{children}</main>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
      <footer className="bg-gray-200 text-center p-4 mt-8">
        © {new Date().getFullYear()} My Website
      </footer>
    </CartProvider>
  );
}

import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Header from "./component/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: "MEP Table",
  description: "A MEP Table for Electrolux Machines",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <CartProvider>
            <Header />
            <main className="relative min-h-screen">{children}</main>
            <ToastContainer
              position="top-right"
              autoClose={2000}
              theme="colored"
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

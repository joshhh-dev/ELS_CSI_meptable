"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import CartButton from "./CartButton";
import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [underlineStyle, setUnderlineStyle] = useState({});
  const navRefs = useRef({});
  const [bubbles, setBubbles] = useState([]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/machines", label: "Machines" },
    { href: "/compute", label: "Compute" },
  ];

useEffect(() => {
  if (navRefs.current[pathname]) {
    const el = navRefs.current[pathname];
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.getBoundingClientRect();

    setUnderlineStyle({
      left: rect.left - parentRect.left, // relative to parent
      width: rect.width,
    });
  }
}, [pathname]);


  useEffect(() => {
  const generated = Array.from({ length: 10 }).map(() => ({
    left: Math.random() * 100,
    bottom: Math.random() * 20,
    delay: Math.random() * 6,
    duration: 6 + Math.random() * 5,
  }));
  setBubbles(generated);
}, []);

  return (
    <header className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-400 to-cyan-600 animate-gradient"></div>

      {/* Bubble Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles.map((b, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-white/40 rounded-full animate-bubble"
            style={{
              left: `${b.left}%`,
              bottom: `-${b.bottom}px`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Header Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-4 flex justify-between items-center text-white z-10">
        {/* Branding */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-2xl tracking-wide hover:opacity-90 transition"
        >
          MEP Table
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 relative">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              ref={(el) => (navRefs.current[href] = el)}
              className={`relative px-4 py-2 rounded-full font-medium transition ${
                pathname === href
                  ? "text-white"
                  : "hover:bg-white/20 text-white/80"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Sliding underline */}
          <motion.div
            className="absolute bottom-0 h-1 bg-white"
            initial={false}
            animate={{ left: underlineStyle.left, width: underlineStyle.width }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {user ? (
            <>
              <CartButton />
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-white text-blue-700 font-medium hover:bg-gray-100 transition"
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/20 transition"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown with animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-600 px-6 py-4 space-y-4 overflow-hidden relative z-20"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block relative px-3 py-2 rounded-lg transition ${
                  pathname === href
                    ? "bg-white text-indigo-700 font-semibold"
                    : "hover:bg-white/20"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            ))}

            {user ? (
              <>
                <CartButton />
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 rounded-lg bg-white text-indigo-700 font-semibold hover:bg-gray-100 transition"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

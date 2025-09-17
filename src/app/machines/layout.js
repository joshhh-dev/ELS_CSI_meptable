"use client";

import "../globals.css";
import { SearchProvider } from "../context/SearchContext";
import SearchBar from "../component/SearchBar";
import ProtectedRoute from "../component/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function MachinesLayout({ children }) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/machines/washer", label: "Washer" },
    { href: "/machines/dryer", label: "Dryer" },
    { href: "/machines/ironer", label: "Ironer" },
  ];

  return (
    <ProtectedRoute>
      <SearchProvider>
        <div className="bg-gray-50 min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white shadow-md">
            <div className="flex justify-between items-center px-8 py-5">
              {/* Logo / Title */}
              <h1 className="text-xl md:text-2xl font-bold tracking-wide">
                Machines Dashboard
              </h1>

              {/* Desktop Nav */}
              <nav className="hidden md:flex space-x-10 relative">
                {navLinks.map(({ href, label }) => {
                  const isActive = pathname === href;
                  return (
                    <div key={href} className="relative">
                      <Link
                        href={href}
                        className={`text-lg font-medium px-3 py-2 rounded-md transition ${
                          isActive
                            ? "text-indigo-700"
                            : "text-gray-600 hover:text-indigo-600"
                        }`}
                      >
                        {label}
                      </Link>

                      {/* Animated underline */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 right-0 -bottom-1 h-1 bg-indigo-600 rounded-full"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Search */}
              <div className="w-1/3 hidden md:block">
                <SearchBar />
              </div>
            </div>
          </header>

          {/* Mobile Nav + Search */}
          <div className="p-4 md:hidden bg-white shadow-sm space-y-3">
            <SearchBar />
            <nav className="flex justify-around relative">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <div key={href} className="relative">
                    <Link
                      href={href}
                      className={`text-sm font-medium px-3 py-1 rounded-md transition ${
                        isActive
                          ? "text-indigo-700"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      {label}
                    </Link>
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTab"
                        className="absolute left-0 right-0 -bottom-1 h-1 bg-indigo-600 rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Animated Main Content */}
          <main className="flex-1 px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </SearchProvider>
    </ProtectedRoute>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "../app/context/AuthContext";
import { WashingMachine, BarChart3, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const [bubbles, setBubbles] = useState([]);

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
    <div className="min-h-screen relative overflow-hidden text-white flex flex-col">
      {/* Full Laundry Theme Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-cyan-400 to-blue-600 animate-gradient">
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
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 animate-fadeIn gap-5">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white drop-shadow-lg">
            Welcome to ELS
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mb-8 opacity-90">
            Easily explore machines, run computations, and manage your data in real time.
          </p>

          {!loading && (
            <div className="flex gap-2 sm:gap-4 md:gap-6 flex-wrap justify-center">
              {user ? (
                <>
                  <Link
                    href="/cart"
                    className="px-6 py-3 bg-white text-blue-700 rounded-lg font-semibold shadow hover:shadow-lg transition transform hover:-translate-y-1"
                  >
                    Go to Cart
                  </Link>
                  <Link
                    href="/compute"
                    className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-semibold shadow hover:bg-yellow-500 transition transform hover:-translate-y-1"
                  >
                    Computations
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-6 py-3 bg-green-500 text-900 rounded-lg font-semibold shadow hover:-translate-y-2 transition transform hover:-translate-y-1"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          )}
        </section>
        <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 animate-fadeIn overflow-hidden p-2 sm:p-3 md:p-4">
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


  {/* Content */}
  <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
    
    <div className="p-8 rounded-2xl shadow-lg transition transform bg-gradient-to-br from-blue-100 to-white border border-blue-200">
      <WashingMachine className="mx-auto mb-4 text-blue-600" size={50} />
      <h3 className="text-2xl font-bold mb-3 text-blue-700">Machines</h3>
      <p className="text-gray-600">Browse washer extractors, dryers, and ironers with full specs.</p>
    </div>

    <div className="p-8 rounded-2xl shadow-lg transition transform bg-gradient-to-br from-green-100 to-white border border-green-200">
      <BarChart3 className="mx-auto mb-4 text-green-600" size={50} />
      <h3 className="text-2xl font-bold mb-3 text-green-700">Compute</h3>
      <p className="text-gray-600">Run detailed consumption computations for your setup.</p>
    </div>

    <div className="p-8 rounded-2xl shadow-lg transition transform bg-gradient-to-br from-yellow-100 to-white border border-yellow-200">
      <ShoppingCart className="mx-auto mb-4 text-yellow-600" size={50} />
      <h3 className="text-2xl font-bold mb-3 text-yellow-700">Cart</h3>
      <p className="text-gray-600">Keep track of selected machines and manage your setup easily.</p>
    </div>
  </div>
</section>



        {/* Footer */}
        <footer className="py-8 text-center text-sm bg-gray-900 text-gray-400">
          © {new Date().getFullYear()}{" "}
          <Link href="/" className="hover:underline">
            Electrolux MEP
          </Link>{" "}
          — All rights reserved.
        </footer>
      </div>
    </div>
  );
}

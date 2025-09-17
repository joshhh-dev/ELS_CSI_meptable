"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MachinesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/machines/washer");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600 animate-pulse">Redirecting to washer...</p>
    </div>
  );
}

"use client";

import { useUserSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CSVUploader from "@/components/CSVUploader";
export default function Home() {
  const { user, loading } = useUserSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">📊 SMB KPI Dashboard</h1>
      <CSVUploader />
    </main>
  );
}

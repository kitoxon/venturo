"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface EarlyAccessEntry {
  id: string;
  email: string;
  created_at: string;
  invited: boolean;
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL!;
export default function AdminPage() {
  const [emails, setEmails] = useState<EarlyAccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userEmail = session?.session?.user?.email;
      if (userEmail === ADMIN_EMAIL) {
        setAuthorized(true);
        fetchEmails();
      } else {
        router.push("/login");
      }
      setLoading(false);
    };

    checkAuth();
  });

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from("early_access")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setEmails(data);
  };

  const toggleInvited = async (id: string, invited: boolean) => {
    await supabase.from("early_access").update({ invited }).eq("id", id);
    fetchEmails();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Loading admin...
      </div>
    );
  }

  if (!authorized) {
    return null; // blank screen during redirect
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📬 Early Access Signups</h1>
      <ul className="space-y-2">
        {emails.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between border p-3 rounded"
          >
            <div>
              <p className="font-medium">{entry.email}</p>
              <p className="text-xs text-gray-400">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant={entry.invited ? "secondary" : "default"}
              onClick={() => toggleInvited(entry.id, !entry.invited)}
            >
              {entry.invited ? "Invited" : "Mark Invited"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

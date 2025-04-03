"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");
    };
    fetchUser();
  }, []);

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to permanently delete your account?",
    );
    if (!confirmed) return;

    await supabase.auth.signOut();
    await supabase.rpc("delete_user"); // Optional: custom RPC to delete user data
    window.location.href = "/login";
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow border mt-6">
      <h1 className="text-2xl font-bold mb-4">⚙️ Settings</h1>

      <div className="space-y-6 text-sm text-gray-700">
        <div>
          <p className="font-medium">Email</p>
          <p className="text-gray-500">{email}</p>
        </div>

        <div>
          <p className="font-medium">Language</p>
          <select className="mt-1 border rounded px-3 py-2 w-full">
            <option>English</option>
            <option disabled>Coming Soon</option>
          </select>
        </div>

        <div>
          <p className="font-medium">Support</p>
          <p>
            “Feel free to reply to this email — it goes straight to me.”{" "}
            <a
              href="mailto:s.munkhjin.u@gmail.com"
              className="text-blue-600 hover:underline"
            >
              s.munkhjin.u@gmail.com
            </a>
          </p>
        </div>

        <div className="pt-4 border-t">
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

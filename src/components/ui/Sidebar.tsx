"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, UploadCloud, LayoutDashboard } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Uploads", href: "/dashboard/uploads", icon: UploadCloud },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 h-screen bg-white border-r hidden md:flex flex-col justify-between p-4">
      <nav className="space-y-2">
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link key={name} href={href}>
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 ${
                pathname === href
                  ? "bg-gray-100 text-blue-600"
                  : "text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {name}
            </div>
          </Link>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 text-sm text-gray-500 hover:text-red-500"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { exportToCSV } from "@/lib/exportToCSV";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { Download, Pen, Trash } from "lucide-react";

interface UploadEntry {
  id: string;
  name: string;
  created_at: string;
  data: any[];
  forecast_results?: any[];
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  useEffect(() => {
    const fetchUploads = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setUploads(data);
    };

    fetchUploads();
  }, []);

  const handleRename = async (id: string) => {
    const { error } = await supabase
      .from("uploads")
      .update({ name: renameInput })
      .eq("id", id);
    if (!error) {
      setUploads((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, name: renameInput } : entry,
        ),
      );
      setRenamingId(null);
    }
  };
  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    const { error } = await supabase
      .from("uploads")
      .delete()
      .eq("id", pendingDeleteId);
    if (!error) {
    }
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📁 Your Uploads</h1>
      <ul className="space-y-3">
        {uploads.map((entry) => (
          <li
            key={entry.id}
            className="border rounded p-4 flex justify-between items-center"
          >
            <div className="flex flex-col">
              {renamingId === entry.id ? (
                <input
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  onBlur={() => handleRename(entry.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(entry.id)}
                  className="border rounded px-2 py-1 text-sm"
                />
              ) : (
                <p className="font-medium text-sm">
                  {entry.name}{" "}
                  <span className="text-xs text-gray-400 ml-1">
                    ({new Date(entry.created_at).toLocaleDateString()})
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRenamingId(entry.id);
                  setRenameInput(entry.name);
                }}
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToCSV(entry.data, `${entry.name}.csv`)}
              >
                <Download className="h4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteClick(entry.id)}
                className="text-red-500"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Upload?"
        message="This action cannot be undone. Are you sure you want to delete this dataset?"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

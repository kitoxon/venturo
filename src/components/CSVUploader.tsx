import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { parseCSV } from "@/lib/parseCSV"; // You must create this helper
// Type definitions
interface DataRow {
  Date: string;
  Revenue: number;
  Expenses: number;
}

interface ForecastResult {
  date: string;
  forecasted_revenue: number;
}

interface UploadEntry {
  id: string;
  name: string;
  created_at: string;
  data: DataRow[];
  forecast_results: ForecastResult[];
}
function getAlertStyle(message: string) {
  if (message.includes("✅") || message.includes("📈")) {
    return "bg-green-50 border-green-400 text-green-800";
  } else if (message.includes("⚠️") || message.includes("📉")) {
    return "bg-yellow-50 border-yellow-400 text-yellow-800";
  } else if (message.includes("🔴") || message.includes("💀")) {
    return "bg-red-50 border-red-400 text-red-800";
  } else {
    return "bg-gray-50 border-gray-300 text-gray-700";
  }
}
function SummaryCard({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow border text-center">
      <p className="text-sm text-gray-500 mb-1">
        {emoji} {label}
      </p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
export default function CSVUploader() {
  const [data, setData] = useState<DataRow[]>([]);
  const [forecast, setForecast] = useState<ForecastResult[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [history, setHistory] = useState<UploadEntry[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleaned = await parseCSV(file);
    setData(cleaned);
    setInsights(generateInsights(cleaned));

    const formData = new FormData();
    formData.append("file", file);
    try {
      setSaveStatus("saving");

      const response = await fetch("http://localhost:8000/forecast", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.forecast) {
        setForecast(result.forecast);

        const user = (await supabase.auth.getUser()).data.user;
        await supabase.from("uploads").insert([
          {
            user_id: user?.id,
            name: file.name,
            data: cleaned,
            forecast_results: result.forecast,
          },
        ]);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 1500);
        fetchLatestUpload();
      }
    } catch (error) {
      console.error("Forecast API error:", error);
    }
  };

  const fetchLatestUpload = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const latest = data[0];
      setData(latest.data);
      setForecast(latest.forecast_results || []);
      setInsights(generateInsights(latest.data));
    }
  };

  const generateInsights = (data: DataRow[]): string[] => {
    if (data.length < 2) return ["Not enough data for insights."];
    const last = data[data.length - 1];
    const prev = data[data.length - 2];

    const revenueGrowth = ((last.Revenue - prev.Revenue) / prev.Revenue) * 100;
    const expenseGrowth =
      ((last.Expenses - prev.Expenses) / prev.Expenses) * 100;
    const burnRate = last.Revenue - last.Expenses;
    const totalCash = data.reduce(
      (sum, row) => sum + (row.Revenue - row.Expenses),
      0,
    );
    const avgBurn = totalCash / data.length;
    const runway =
      avgBurn <= 0
        ? "⚠️ Out of cash soon!"
        : `${(totalCash / avgBurn).toFixed(1)} months`;

    const insights: string[] = [];
    if (last.Revenue < last.Expenses) {
      insights.push(
        "⚠️ You're spending more than you earn. Consider reducing costs.",
      );
    } else {
      insights.push("✅ Revenue is higher than expenses. Keep it up!");
    }

    if (revenueGrowth > 0) {
      insights.push(
        `📈 Revenue grew by ${revenueGrowth.toFixed(1)}% last month.`,
      );
    } else {
      insights.push(
        `📉 Revenue dropped by ${Math.abs(revenueGrowth).toFixed(1)}% from last month.`,
      );
    }

    if (expenseGrowth > 15) {
      insights.push(
        `⚠️ Expenses jumped by ${expenseGrowth.toFixed(1)}% — review spending.`,
      );
    }

    insights.push(`💰 Estimated cash runway: ${runway}`);
    insights.push(
      `🔥 Monthly burn rate: $${Math.abs(burnRate).toLocaleString()}`,
    );
    return insights;
  };
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const burnRate = last && prev ? last.Revenue - last.Expenses : 0;
  const revenueGrowth =
    last && prev ? ((last.Revenue - prev.Revenue) / prev.Revenue) * 100 : 0;
  const totalCash = data.reduce(
    (sum, row) => sum + (row.Revenue - row.Expenses),
    0,
  );
  const avgBurn = totalCash / (data.length || 1);
  const runway =
    avgBurn <= 0 ? "⚠️" : `${(totalCash / avgBurn).toFixed(1)} months`;
  const profitability = burnRate >= 0 ? "✅ Positive" : "⚠️ Negative";
  const handleRenameConfirm = async (id: string) => {
    const { error } = await supabase
      .from("uploads")
      .update({ name: renameInput })
      .eq("id", id);

    if (!error) {
      const updated = history.map((upload) =>
        upload.id === id ? { ...upload, name: renameInput } : upload,
      );
      setHistory(updated);
      setRenamingId(null);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("uploads")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setHistory(data as UploadEntry[]);

        if (data.length > 0) {
          setData(data[0].data);
          setForecast(data[0].forecast_results || []);
          setInsights(generateInsights(data[0].data));
        }
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {data.length === 0 && (
        <div className="bg-white rounded-xl shadow p-6 border text-center text-gray-600 mt-6">
          <p className="text-lg">
            📊 Upload a CSV to generate your dashboard insights.
          </p>
          <p className="text-sm mt-1 text-gray-400">
            We’ll analyze revenue, expenses, trends, and give you 3-month
            AI-powered forecasts.
          </p>
        </div>
      )}
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow p-6 border">
        <label className="cursor-pointer border border-dashed border-gray-300 md:text-base text-sm rounded-md p-4 text-center hover:bg-gray-100 transition">
          📁 Click or drag a CSV file to upload
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Burn Rate"
          value={`$${Math.abs(burnRate).toLocaleString()}`}
          emoji="🔥"
        />
        <SummaryCard label="Runway" value={runway} emoji="🛟" />
        <SummaryCard
          label="Revenue Growth"
          value={`${revenueGrowth.toFixed(1)}%`}
          emoji="📈"
        />
        <SummaryCard label="Profitability" value={profitability} emoji="💸" />
      </div>
      {/* Main Chart */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border">
          <h2 className="text-lg font-semibold mb-4">📊 Revenue & Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="Date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#6366f1" // Indigo-500
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Expenses"
                stroke="#10b981" // Emerald-500
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Forecast Chart */}
        {forecast.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow border">
            <h2 className="text-lg font-semibold mb-2">📈 Forecast</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Line
                    type="monotone"
                    dataKey="forecasted_revenue"
                    stroke="#f97316" // Orange-500 (Tailwind)
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Forecasted Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow border">
          <h2 className="text-lg font-semibold mb-4">🧠 AI Insights</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map((msg, idx) => (
              <div
                key={idx}
                className={`bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-800 shadow-sm ${getAlertStyle(msg)}`}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.length === 0 && (
        <p className="text-gray-400 italic">
          No data uploaded yet. Your CSV table will appear here once uploaded.
        </p>
      )}
      {/* Raw Table */}
      {data.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow border overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">📄 Uploaded Data</h2>
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-sm border">
              <thead>
                <tr>
                  {Object.keys(data[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="border px-4 py-2 font-medium bg-gray-100"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="border px-4 py-2">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 border mb-6">
          <h2 className="text-xl font-semibold mb-4">📚 Upload History</h2>
          {saveStatus === "saving" && (
            <p className="text-xs text-gray-400">Saving...</p>
          )}
          {saveStatus === "saved" && (
            <p className="text-xs text-green-500">Saved ✔</p>
          )}

          <ul className="space-y-2">
            {history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2"
              >
                {renamingId === item.id ? (
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onBlur={() => handleRenameConfirm(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameConfirm(item.id);
                    }}
                    className="text-sm border px-2 py-1 rounded w-full"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setData(item.data);
                      setForecast(item.forecast_results || []);
                      setInsights(generateInsights(item.data));
                    }}
                    className="text-left text-sm text-blue-600 hover:underline flex-1"
                  >
                    {item.name}{" "}
                    <span className="text-gray-400 text-xs ml-1">
                      ({new Date(item.created_at).toLocaleDateString()})
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={async () => {
              const user = (await supabase.auth.getUser()).data.user;
              if (!user || data.length === 0) return;

              const { error } = await supabase.from("uploads").insert([
                {
                  user_id: user.id,
                  name: `Copy of ${new Date().toISOString()}`,
                  data,
                  forecast_results: forecast,
                },
              ]);

              if (!error) fetchLatestUpload();
            }}
            className="mt-4 text-sm text-blue-600 hover:underline cursor-pointer"
          >
            Save as Copy
          </button>
        </div>
      )}
    </div>
  );
}

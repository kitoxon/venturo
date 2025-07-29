"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("early_access").insert([{ email }]);

    if (!error) {
      console.log("Submitted email:", email);
      setSubmitted(true);
    } else {
      console.error("Error submitting:", error.message);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12 flex flex-col items-center">
      <div className="max-w-2xl text-center">
        <p className="uppercase text-sm tracking-wider text-gray-400 mb-2">
          For Startups & Small Teams
        </p>

        <h1 className="text-4xl font-bold mb-4">
          Predict Your Future with{" "}
          <span className="text-indigo-600">Venturo</span>
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Upload your revenue and expense CSV. Instantly see your runway, growth
          trends, and 3-month forecasts — no setup, no integrations.
        </p>

        <Card className="p-6">
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email for early access"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  Request Early Access
                </Button>
              </form>
            ) : (
              <p className="text-green-600 font-medium">
                🎉 Thanks! You&apos;ll hear from us soon.
              </p>
            )}
          </CardContent>
        </Card>
        <hr className="my-12 border-gray-200 w-2/3 mx-auto" />

        <div className="mt-12">
          <Image
            src="/dashboard-preview.png"
            width={1832}
            height={1060}
            alt="Dashboard preview"
            className="rounded-xl shadow-xl border"
          />
        </div>
      </div>
    </main>
  );
}

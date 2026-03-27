"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Mail, Lock, Loader2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-light/0 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-gray-900" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            We&apos;ve sent a confirmation link to{" "}
            <span className="text-gray-900 font-medium">{email}</span>. Click the
            link to activate your account.
          </p>
          <Link
            href="/login"
            className="text-sm text-brand hover:text-brand transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light/0 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-4">
            <Zap size={24} className="text-gray-900" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Traderess Copilot
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-xs text-gray-500 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full bg-white/50 border border-brand-light/40 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs text-gray-500 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white/50 border border-brand-light/40 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs text-gray-500 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full bg-white/50 border border-brand-light/40 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand hover:text-brand transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

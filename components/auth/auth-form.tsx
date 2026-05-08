"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthFormState } from "@/actions/auth-actions";
import { loginAction, registerAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" size="lg" variant="ntnu" disabled={pending}>
      {pending ? "Jobber..." : label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {});
  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-soft">
      <div className="mb-6">
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-ink text-xl font-bold text-white">∑</div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
          {isLogin ? "Logg inn" : "Opprett bruker"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {isLogin ? "Fortsett øvingen din i TMA4422." : "Lagre progresjon på tvers av økter."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {!isLogin && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">Navn</span>
            <input
              name="name"
              autoComplete="name"
              className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-colors focus:border-stone-400"
              required
            />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-stone-700">E-post</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-colors focus:border-stone-400"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-stone-700">Passord</span>
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-colors focus:border-stone-400"
            required
          />
        </label>
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
        <SubmitButton label={isLogin ? "Logg inn" : "Registrer"} />
      </form>

      <div className="mt-5 text-center text-sm text-stone-500">
        {isLogin ? "Ny her?" : "Har du bruker?"}{" "}
        <Link className="font-semibold text-stone-900 underline" href={isLogin ? "/register" : "/login"}>
          {isLogin ? "Opprett bruker" : "Logg inn"}
        </Link>
      </div>

      {isLogin && (
        <div className="mt-5 rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">
          Demo: <span className="font-mono">student@matte3.local</span> / <span className="font-mono">student-demo</span>
        </div>
      )}
    </div>
  );
}

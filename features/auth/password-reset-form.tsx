"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset } from "@/services/auth";
import { passwordResetSchema, type PasswordResetValues } from "./schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordResetForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await requestPasswordReset(values);
      setSubmitted(true);
    } catch (err: unknown) {
      // Rate limit: tell the user to wait. Any other error: generic message.
      // We do NOT distinguish "email not found" to avoid user enumeration.
      const status = (err as { status?: number })?.status ??
        (err as { response?: { status?: number } })?.response?.status;
      if (status === 429) {
        setServerError("Too many requests. Please wait a few minutes before trying again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
          <CheckCircle2 className="size-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists with this email/phone, you will receive reset
          instructions.
        </p>
        <Button variant="outline" asChild className="mt-2">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email or phone and we&apos;ll send reset instructions if an
          account exists.
        </p>
      </div>

      {serverError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {serverError}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="identifier">Email or phone</Label>
        <Input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder="you@school.edu or +91 98765 43210"
          aria-invalid={!!errors.identifier}
          {...register("identifier")}
        />
        {errors.identifier ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.identifier.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Send reset instructions
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

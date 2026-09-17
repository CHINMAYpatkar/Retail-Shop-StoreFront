'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { requestOtp, verifyOtp } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';

/**
 * One email field, then a code. There is no separate "register" here.
 *
 * The system is passwordless, so proving control of an email address IS the
 * authentication - which makes signing in and signing up the same action, and
 * splitting them leaked which addresses had accounts (ADR 0015).
 *
 * The screen therefore cannot say "welcome back" or "create your account" at
 * the email step, because it genuinely does not know yet - and must not, or the
 * page becomes the oracle the API no longer is.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);

  // Move focus to the code box when it appears, so the customer keeps typing
  // instead of hunting for the next field.
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  // A cooldown, so Resend cannot be hammered. The server rate-limits too; this
  // is about not inviting the customer to do something that will fail.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(isResend = false) {
    setBusy(true);
    try {
      await requestOtp(email.trim());
      setStep('code');
      setResendIn(30);
      toast.success(isResend ? 'New code sent' : 'Check your email for the code');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the code. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode() {
    setBusy(true);
    try {
      const { profileComplete } = await verifyOtp(email.trim(), code.trim());

      // The routing decision comes from the server, not from anything this form
      // guessed at the email step.
      if (!profileComplete) {
        router.push(`/account/complete${next ? `?next=${encodeURIComponent(next)}` : ''}`);
        return;
      }

      toast.success('Signed in');
      router.push(next || '/account');
    } catch (error) {
      toast.error(getErrorMessage(error, 'That code is invalid or has expired.'));
      setCode('');
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  if (step === 'email') {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (email.trim()) void sendCode();
        }}
        className="space-y-5"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-800">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-3 text-ink-900 placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
          />
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            We will email you a 6-digit code. No password needed — new or returning, it is the
            same step.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {busy ? 'Sending…' : 'Email me a code'}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim().length === 6) void submitCode();
      }}
      className="space-y-5"
    >
      <button
        type="button"
        onClick={() => {
          setStep('email');
          setCode('');
        }}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Use a different email
      </button>

      <div>
        <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-ink-800">
          Enter the 6-digit code
        </label>
        <input
          ref={codeRef}
          id="code"
          // text with a numeric inputMode: type="number" brings spinners, strips
          // leading zeros, and scrolls the value on a trackpad.
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full rounded-md border border-ink-200 bg-paper-50 px-3.5 py-3 text-center font-data text-xl tracking-[0.4em] text-ink-900 placeholder:tracking-normal placeholder:text-ink-300 focus:border-gold-500 focus:outline-none"
        />
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Sent to <span className="text-ink-800">{email}</span>. It expires shortly.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy || code.trim().length !== 6}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-medium text-ink-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:bg-paper-300 disabled:text-ink-400"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Checking…' : 'Continue'}
      </button>

      <button
        type="button"
        disabled={busy || resendIn > 0}
        onClick={() => void sendCode(true)}
        className="w-full text-sm text-ink-500 transition-colors hover:text-gold-700 disabled:cursor-not-allowed disabled:text-ink-300"
      >
        {resendIn > 0 ? `Resend in ${resendIn}s` : 'Send a new code'}
      </button>
    </form>
  );
}

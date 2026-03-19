"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                redirect: false,
                identifier,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/");
                router.refresh();
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-root">
            <div className="auth-card">
                {/* Brand */}
                <div className="auth-brand">
                    <div className="auth-brand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your account to continue</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="auth-alert error" style={{ marginBottom: "1rem" }}>
                        <span className="alert-icon">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </span>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="identifier">
                            Email or Username
                        </label>
                        <input
                            id="identifier"
                            type="text"
                            className="form-input"
                            placeholder="you@example.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            autoComplete="email"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <div className="input-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div style={{ textAlign: "right", marginTop: "4px" }}>
                            <Link href="/forgot-password" style={{ fontSize: "0.75rem", color: "#818cf8", textDecoration: "none" }}>
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="auth-btn"
                        disabled={loading || !identifier || !password}
                    >
                        <span className="auth-btn-content">
                            {loading && <span className="spinner" />}
                            {loading ? "Signing in…" : "Sign in"}
                        </span>
                    </button>
                </form>

                {/* Footer */}
                <p className="auth-footer">
                    Don&apos;t have an account?{" "}
                    <Link href="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}

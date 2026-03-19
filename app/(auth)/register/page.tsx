"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? "";

async function strapiRegister(username: string, email: string, password: string) {
    const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
        const msg =
            data?.error?.message ||
            data?.message?.[0]?.messages?.[0]?.message ||
            "Registration failed.";
        throw new Error(msg);
    }
    return data;
}

function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Field-level validation
    const emailError = email && !validateEmail(email) ? "Enter a valid email address." : "";
    const passwordError =
        password && password.length < 6 ? "Password must be at least 6 characters." : "";
    const confirmError =
        confirmPassword && confirmPassword !== password ? "Passwords do not match." : "";

    const isValid =
        username.trim().length >= 2 &&
        validateEmail(email) &&
        password.length >= 6 &&
        password === confirmPassword;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid) return;
        setError("");
        setLoading(true);

        try {
            await strapiRegister(email.trim(), email.trim(), password);

            // Auto sign-in after successful registration
            const result = await signIn("credentials", {
                redirect: false,
                identifier: email.trim(),
                password,
            });

            if (result?.error) {
                // Registration succeeded, but sign-in failed — redirect to login
                router.push("/login?registered=true");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
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
                    <h1 className="auth-title">Create an account</h1>
                    <p className="auth-subtitle">Join us today — it&apos;s completely free</p>
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
                    {/* Username */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="form-input"
                            placeholder="johndoe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            disabled={loading}
                        />
                        {username.length > 0 && username.trim().length < 2 && (
                            <p className="field-error">
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                Username must be at least 2 characters.
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={`form-input${emailError ? " error-input" : ""}`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={loading}
                        />
                        {emailError && (
                            <p className="field-error">
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {emailError}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-password">
                            Password
                        </label>
                        <div className="input-wrapper">
                            <input
                                id="reg-password"
                                type={showPassword ? "text" : "password"}
                                className={`form-input${passwordError ? " error-input" : ""}`}
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
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
                        {passwordError && (
                            <p className="field-error">
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {passwordError}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirm-password">
                            Confirm password
                        </label>
                        <input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            className={`form-input${confirmError ? " error-input" : ""}`}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            disabled={loading}
                        />
                        {confirmError && (
                            <p className="field-error">
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {confirmError}
                            </p>
                        )}
                    </div>

                    <button
                        id="register-submit"
                        type="submit"
                        className="auth-btn"
                        disabled={loading || !isValid}
                    >
                        <span className="auth-btn-content">
                            {loading && <span className="spinner" />}
                            {loading ? "Creating account…" : "Create account"}
                        </span>
                    </button>

                    <p className="auth-terms">
                        By registering, you agree to our{" "}
                        <a href="#">Terms of Service</a> and{" "}
                        <a href="#">Privacy Policy</a>.
                    </p>
                </form>

                {/* Footer */}
                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link href="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

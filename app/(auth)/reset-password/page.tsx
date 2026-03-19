// "use client";
// import { useState, Suspense } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";

// function ResetPasswordForm() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const code = searchParams.get("code");

//     const [password, setPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState(false);

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         if (password !== confirmPassword) {
//             setError("Passwords do not match.");
//             return;
//         }
//         if (!code) {
//             setError("Reset code is missing. Please check your email link.");
//             return;
//         }

//         setError("");
//         setLoading(true);

//         try {
//             const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/reset-password`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     code,
//                     password,
//                     passwordConfirmation: confirmPassword,
//                 }),
//             });

//             if (!res.ok) {
//                 const data = await res.json();
//                 throw new Error(data?.error?.message || "Failed to reset password.");
//             }

//             setSuccess(true);
//             setTimeout(() => {
//                 router.push("/login");
//             }, 3000);
//         } catch (err: any) {
//             setError(err.message || "Something went wrong.");
//         } finally {
//             setLoading(false);
//         }
//     }

//     if (!code) {
//         return (
//             <div className="auth-alert error">
//                 Invalid or expired reset link. Please <Link href="/forgot-password">request a new one</Link>.
//             </div>
//         );
//     }

//     return (
//         <form className="auth-form" onSubmit={handleSubmit} noValidate>
//             {error && <div className="auth-alert error">{error}</div>}
//             {success && (
//                 <div className="auth-alert success" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#86efac", border: "1px solid rgba(34, 197, 94, 0.2)", padding: "1rem", borderRadius: "12px" }}>
//                     Password reset successfully! Redirecting to login...
//                 </div>
//             )}

//             {!success && (
//                 <>
//                     <div className="form-group">
//                         <label className="form-label" htmlFor="password">New Password</label>
//                         <input
//                             id="password"
//                             type="password"
//                             className="form-input"
//                             placeholder="At least 6 characters"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                             disabled={loading}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
//                         <input
//                             id="confirm-password"
//                             type="password"
//                             className="form-input"
//                             placeholder="Repeat your new password"
//                             value={confirmPassword}
//                             onChange={(e) => setConfirmPassword(e.target.value)}
//                             required
//                             disabled={loading}
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         className="auth-btn"
//                         disabled={loading || !password || !confirmPassword}
//                     >
//                         <span className="auth-btn-content">
//                             {loading && <span className="spinner" />}
//                             {loading ? "Resetting…" : "Reset Password"}
//                         </span>
//                     </button>
//                 </>
//             )}
//         </form>
//     );
// }

// export default function ResetPasswordPage() {
//     return (
//         <div className="auth-root">
//             <div className="auth-card">
//                 <div className="auth-brand">
//                     <div className="auth-brand-icon">
//                         <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                             <path d="M12 15L12 12M12 9H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
//                         </svg>
//                     </div>
//                     <h1 className="auth-title">New Password</h1>
//                     <p className="auth-subtitle">Set a strong password for your account</p>
//                 </div>

//                 <Suspense fallback={<div className="spinner" />}>
//                     <ResetPasswordForm />
//                 </Suspense>

//                 <div className="auth-footer">
//                     Back to <Link href="/login">Sign in</Link>
//                 </div>
//             </div>
//         </div>
//     );
// }

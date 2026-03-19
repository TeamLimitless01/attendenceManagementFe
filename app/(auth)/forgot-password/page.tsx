// "use client";
// import { useState } from "react";
// import Link from "next/link";

// export default function ForgotPasswordPage() {
//     const [email, setEmail] = useState("");
//     const [loading, setLoading] = useState(false);
//     const [success, setSuccess] = useState(false);
//     const [error, setError] = useState("");

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setError("");
//         setLoading(true);

//         try {
//             // Strapi forgot password endpoint: /api/auth/forgot-password
//             const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/forgot-password`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ email }),
//             });

//             if (!res.ok) {
//                 const data = await res.json();
//                 throw new Error(data?.error?.message || "Failed to send reset email.");
//             }

//             setSuccess(true);
//         } catch (err: any) {
//             setError(err.message || "Something went wrong.");
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <div className="auth-root">
//             <div className="auth-card">
//                 <div className="auth-brand">
//                     <div className="auth-brand-icon">
//                         <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                             <path d="M12 15L12 12M12 9H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/>
//                         </svg>
//                     </div>
//                     <h1 className="auth-title">Reset Password</h1>
//                     <p className="auth-subtitle">Enter your email and we&apos;ll send you a link to reset your password</p>
//                 </div>

//                 {success ? (
//                     <div className="auth-alert success" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#86efac", border: "1px solid rgba(34, 197, 94, 0.2)", padding: "1rem", borderRadius: "12px" }}>
//                         Check your email! We&apos;ve sent a password reset link to <strong>{email}</strong>.
//                     </div>
//                 ) : (
//                     <form className="auth-form" onSubmit={handleSubmit} noValidate>
//                         {error && (
//                             <div className="auth-alert error">
//                                 {error}
//                             </div>
//                         )}

//                         <div className="form-group">
//                             <label className="form-label" htmlFor="email">Email address</label>
//                             <input
//                                 id="email"
//                                 type="email"
//                                 className="form-input"
//                                 placeholder="you@example.com"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 required
//                                 disabled={loading}
//                             />
//                         </div>

//                         <button
//                             type="submit"
//                             className="auth-btn"
//                             disabled={loading || !email}
//                         >
//                             <span className="auth-btn-content">
//                                 {loading && <span className="spinner" />}
//                                 {loading ? "Sending link…" : "Send Reset Link"}
//                             </span>
//                         </button>
//                     </form>
//                 )}

//                 <div className="auth-footer">
//                     Back to <Link href="/login">Sign in</Link>
//                 </div>
//             </div>
//         </div>
//     );
// }

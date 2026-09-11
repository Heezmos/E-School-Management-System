"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage(){
  const supabase=createClient();
  const[loading,setLoading]=useState(false);
  const[message,setMessage]=useState("");
  const[error,setError]=useState("");

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setLoading(true);setMessage("");setError("");
    const f=new FormData(e.currentTarget);const email=String(f.get("email")||"").trim().toLowerCase();
    const redirectTo=`${window.location.origin}/change-password?recovery=1`;
    const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
    if(error){setError(error.message);setLoading(false);return;}
    setMessage("Password reset email sent. Open the email and follow the link to create a new password.");setLoading(false);
  }

  return <main className="edu-access login-access"><section className="access-story"><Link href="/" className="access-logo"><span>E</span><b>E-School<small>Smart School Management</small></b></Link><div className="access-story-copy"><span className="access-kicker">ACCOUNT RECOVERY</span><h1>Reset your password.</h1><p>Use the email attached to your E-School account. We will send a secure recovery link.</p></div></section><section className="access-form-side login-form-side"><div className="access-top"><Link href="/login">← Back to sign in</Link></div><form className="login-card" onSubmit={submit}><div className="access-heading"><span>SECURE PASSWORD RESET</span><h2>Forgot your password?</h2><p>Enter your account email below.</p></div><label className="access-field"><span>Email address</span><input name="email" type="email" required autoComplete="email" placeholder="name@school.edu"/></label>{error?<div className="access-error">{error}</div>:null}{message?<div className="secure-note"><span>✓</span><p>{message}</p></div>:null}<button className="access-submit" disabled={loading}>{loading?"Sending reset link...":"Send reset link →"}</button></form></section></main>;
}

import { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060D1A", display:"flex",
      alignItems:"center", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
      <div style={{ background:"#0F1E35", border:"1px solid #1E2A45", borderRadius:20,
        padding:"40px 36px", width:360 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:48, height:48, borderRadius:12, margin:"0 auto 12px",
            background:"linear-gradient(135deg,#4F46E5,#818CF8)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:18, color:"#fff" }}>IIT</div>
          <div style={{ fontWeight:800, fontSize:22, color:"#F1F5F9" }}>PrepPortal</div>
          <div style={{ color:"#64748B", fontSize:13, marginTop:4 }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ color:"#94A3B8", fontSize:12 }}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{ display:"block", width:"100%", background:"#0A1628",
              border:"1px solid #1E2A45", borderRadius:8, padding:"10px 14px",
              color:"#F1F5F9", marginTop:4, fontSize:14, boxSizing:"border-box" }}/>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ color:"#94A3B8", fontSize:12 }}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ display:"block", width:"100%", background:"#0A1628",
              border:"1px solid #1E2A45", borderRadius:8, padding:"10px 14px",
              color:"#F1F5F9", marginTop:4, fontSize:14, boxSizing:"border-box" }}/>
        </div>

        {error && <div style={{ color:"#F87171", fontSize:12, marginBottom:12 }}>{error}</div>}

        <button onClick={handle} disabled={loading}
          style={{ width:"100%", background:"#4F46E5", color:"#fff", border:"none",
            borderRadius:10, padding:"11px", fontWeight:700, fontSize:15,
            cursor:"pointer", marginTop:4, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
        </button>

        <div style={{ textAlign:"center", marginTop:16, color:"#64748B", fontSize:13 }}>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <span onClick={()=>{ setIsSignup(!isSignup); setError(""); }}
            style={{ color:"#818CF8", cursor:"pointer", fontWeight:600 }}>
            {isSignup ? "Sign in" : "Sign up"}
          </span>
        </div>
      </div>
    </div>
  );
      }

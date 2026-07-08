import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import App from "./App.jsx";
import Login from "./Login.jsx";

function Root() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("Auth state:", u ? u.email : "not logged in");
      setUser(u);
      setChecking(false);
    });

    // Safety timeout — if Firebase hangs, stop checking after 5 seconds
    const timer = setTimeout(() => {
      setChecking(false);
    }, 5000);

    return () => { unsub(); clearTimeout(timer); };
  }, []);

  if (checking) return (
    <div style={{ minHeight:"100vh", background:"#060D1A", display:"flex",
      alignItems:"center", justifyContent:"center", color:"#818CF8",
      fontFamily:"Inter,sans-serif", fontSize:18 }}>Connecting…</div>
  );

  if (!user) return <Login />;

  return <App user={user} db={db} signOut={() => signOut(auth)} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode><Root /></StrictMode>
);

import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <Suspense fallback={<div className="text-brand-300 text-center">Chargement…</div>}><LoginForm /></Suspense>;
}

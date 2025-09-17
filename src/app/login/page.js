// app/login/page.js
import { Suspense } from "react";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading login...</p>}>
      <LoginPageContent />
    </Suspense>
  );
}

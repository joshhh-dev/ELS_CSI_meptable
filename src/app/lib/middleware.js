// middleware.js
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// ✅ Initialize Firebase Admin SDK once
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function middleware(req) {
  const url = req.nextUrl.clone();

  // Only protect /developer routes
  if (url.pathname.startsWith("/developer")) {
    const token = cookies().get("session")?.value;

    if (!token) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    try {
      // Verify session token with Firebase Admin
      const decoded = await getAuth().verifySessionCookie(token, true);

      // ✅ Check Firestore role here if needed
      // (Or embed role into custom claims in Firebase Auth)
      // For now, let's assume only devs have `developer: true` in claims
      if (decoded.developer) {
        return NextResponse.next(); // allow
      } else {
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch (err) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/developer/:path*"], // protect developer routes
};

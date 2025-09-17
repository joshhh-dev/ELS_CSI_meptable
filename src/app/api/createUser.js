// pages/api/createUser.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, role } = req.body;

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email,
      role: role || "user",
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

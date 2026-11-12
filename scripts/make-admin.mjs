
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ?.replace(/\\n/g, "\n"),
  }),
});

async function makeAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    if (!adminEmail) {
      throw new Error(
        "ADMIN_EMAIL is missing. Set it in .env.local to the email of an existing Firebase user.",
      );
    }

    const user = await getAuth(app).getUserByEmail(adminEmail);

    await getAuth(app).setCustomUserClaims(user.uid, {
      ...user.customClaims,
      admin: true,
    });

    console.log("Admin privileges successfully assigned!");
    console.log("Admin UID:", user.uid);
  } catch (error) {
    console.error("Error assigning admin:", error);
    process.exitCode = 1;
  }
}

makeAdmin();

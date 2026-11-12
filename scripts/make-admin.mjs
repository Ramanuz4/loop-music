
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ?.replace(/\\n/g, "\n");

const adminEmail = process.env.ADMIN_EMAIL?.trim();

async function makeAdmin() {
  try {
    // Validate credentials
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin credentials are missing.");
    }

    if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      throw new Error("ADMIN_EMAIL is missing or invalid.");
    }

    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    const auth = getAuth(app);

    // Find the existing Firebase user
    const user = await auth.getUserByEmail(adminEmail);

    // Assign admin permissions
    await auth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      admin: true,
    });

    // Verify the assigned permissions
    const updatedUser = await auth.getUser(user.uid);

    if (updatedUser.customClaims?.admin !== true) {
      throw new Error("Admin permission verification failed.");
    }

    console.log("--------------------------------");
    console.log("ADMIN CREATED SUCCESSFULLY!");
    console.log("Email:", updatedUser.email);
    console.log("UID:", updatedUser.uid);
    console.log("Admin:", updatedUser.customClaims.admin);
    console.log("--------------------------------");

  } catch (error) {
    console.error("ADMIN ASSIGNMENT FAILED!");
    console.error(error);
    process.exitCode = 1;
  }
}

makeAdmin();


import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

async function testFirebaseAdmin() {
  try {
    console.log("Checking Firebase Admin configuration...");

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ?.replace(/\\n/g, "\n");

    // Check whether credentials exist
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("One or more Firebase Admin credentials are missing.");
    }

    // Check project ID
    if (projectId !== "loop-music-afc5f") {
      throw new Error("Incorrect Firebase project ID.");
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      throw new Error("Invalid service account email format.");
    }

    // Check private key format
    if (
      !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
      !privateKey.includes("-----END PRIVATE KEY-----")
    ) {
      throw new Error("Private key format is incorrect.");
    }

    console.log("Credentials look valid.");

    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

    // Make a real authenticated Firebase request
    const users = await getAuth(app).listUsers(1);

    console.log("--------------------------------");
    console.log("FIREBASE ADMIN CONNECTION SUCCESSFUL!");
    console.log("Project:", projectId);
    console.log("Authentication API: Connected");
    console.log("Users retrieved:", users.users.length);
    console.log("--------------------------------");

  } catch (error) {
    console.error("FIREBASE ADMIN CONNECTION FAILED!");
    console.error(error);
    process.exitCode = 1;
  }
}

testFirebaseAdmin();

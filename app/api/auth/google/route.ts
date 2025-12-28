export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ success: false, message: "Missing idToken" }, { status: 400 });
    }

    const firebaseAdminAuth = getFirebaseAdminAuth();
    const decoded = await firebaseAdminAuth.verifyIdToken(idToken);

    const email = decoded.email;
    const name = decoded.name || decoded.email || "User";

    if (!email) {
      return NextResponse.json({ success: false, message: "Google account has no email" }, { status: 400 });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(decoded.uid, salt);
      user = await User.create({ name, email, password: hashedPassword });
    }

    const tokenData = { userId: user._id.toString(), email: user.email };
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    const token = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

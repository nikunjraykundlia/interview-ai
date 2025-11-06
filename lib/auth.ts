import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET as string | undefined;

export async function verifyToken(token: string) {
  if (!SECRET_KEY) {
    throw new Error("Missing jwt secret key");
  }
  try {
    const secret = new TextEncoder().encode(SECRET_KEY);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export async function getUserIdFromToken(token: string): Promise<string> {
  const payload = await verifyToken(token);
  const userId = (payload as any)?.userId;
  if (!userId) throw new Error("Invalid token payload");
  return userId as string;
}

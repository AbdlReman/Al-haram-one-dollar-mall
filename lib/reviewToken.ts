import crypto from "crypto";

export function generateEditToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

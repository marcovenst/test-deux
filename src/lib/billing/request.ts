import { z } from "zod";

const headerSchema = z.string().min(1);

export function getUserIdFromHeaders(headers: Headers) {
  const fromHeader = headers.get("x-user-id");
  const parsed = headerSchema.safeParse(fromHeader);
  return parsed.success ? parsed.data : null;
}

import { z } from "zod";

export const subscribeSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    contactChannel: z.enum(["email", "phone"]),
    email: z.string().email().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s\-().]{6,20}$/)
      .optional(),
    interests: z.array(z.string().trim().min(2)).min(1),
    keywords: z.array(z.string().trim().min(2)).default([]),
    notifyRealtime: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.contactChannel === "email" && !value.email) {
      ctx.addIssue({
        path: ["email"],
        code: z.ZodIssueCode.custom,
        message: "Email required for email notifications.",
      });
    }
    if (value.contactChannel === "phone" && !value.phone) {
      ctx.addIssue({
        path: ["phone"],
        code: z.ZodIssueCode.custom,
        message: "Phone required for SMS notifications.",
      });
    }
  });

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export type SubscriberRecord = {
  id: string;
  fullName: string;
  contactChannel: "email" | "phone";
  email: string | null;
  phone: string | null;
  interests: string[];
  keywords: string[];
  notifyRealtime: boolean;
  createdAt: string;
};


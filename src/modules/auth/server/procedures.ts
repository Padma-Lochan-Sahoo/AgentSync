// src/auth/server/procedures.ts
import { z } from "zod";
import { createTRPCRouter, baseProcedure } from "@/trpc/init";
import { db } from "@/db";
import { user, verification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { sendOTP } from "@/lib/mailer";

export const authRouter = createTRPCRouter({
  // 1. Send OTP
  sendOtp: baseProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // delete any existing OTP for this email
      await db.delete(verification).where(eq(verification.identifier, input.email));

      // store OTP in DB
      await db.insert(verification).values({
        id: nanoid(),
        identifier: input.email,
        value: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      });

      // send OTP via email
        await sendOTP(input.email, otp);
        return { success: true, message: "OTP sent to email" };
    }),

  // 2. Verify OTP
  // 2. Verify OTP - Fixed to check expiration before validating OTP
verifyOtp: baseProcedure
  .input(z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }))
  .mutation(async ({ input }) => {
    // Find the OTP record
    const [record] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, input.email));

    if (!record) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No verification request found" });
    }

    // Check expiration FIRST, before validating the OTP
    if (record.expiresAt < new Date()) {
      // Clean up expired OTP
      await db.delete(verification).where(eq(verification.id, record.id));
      throw new TRPCError({ code: "BAD_REQUEST", message: "OTP expired" });
    }

    // Then check if OTP matches
    if (record.value !== input.otp) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid OTP" });
    }

    // Mark this verification as successful by updating the value to indicate success
    // We'll keep the record temporarily to confirm verification during user creation
    await db.update(verification)
      .set({ 
        value: `VERIFIED_${input.otp}`, // Mark as verified
        updatedAt: new Date()
      })
      .where(eq(verification.id, record.id));

    return { success: true, message: "Email verified successfully" };
  }),
});

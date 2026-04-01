import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { apiError } from "@/server/services/api-helpers";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());
    const normalized = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, name: true },
    });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset token, then create a fresh one
    await db.verificationToken
      .delete({
        where: {
          identifier_token: {
            identifier: `reset:${normalized}`,
            token: "",
          },
        },
      })
      .catch(() => {
        // No existing token — that's fine
      });

    await db.verificationToken.create({
      data: {
        identifier: `reset:${normalized}`,
        token,
        expires,
      },
    });

    // TODO: send email via Resend
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    // await resend.emails.send({ to: user.email, subject: "Reset your DocFlow password", ... });

    console.info(`[Password Reset] Token for ${normalized}: ${token}`);

    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    return apiError(err);
  }
}

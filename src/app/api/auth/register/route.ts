import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { apiError } from "@/server/services/api-helpers";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const normalized = email.toLowerCase().trim();

    const existing = await db.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    await db.user.create({
      data: {
        name,
        email: normalized,
        passwordHash,
      },
    });

    return NextResponse.json({ message: "Account created successfully." }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}

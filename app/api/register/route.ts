import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { validateAndSanitizeInput, userRegistrationSchema } from '@/lib/security/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate and sanitize input
    const validation = validateAndSanitizeInput(userRegistrationSchema, body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'USER', // Default role
      },
    });

    return NextResponse.json({ message: 'User registered successfully', user: { id: newUser.id, email: newUser.email } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateToken, hashPassword } from '@/lib/auth';
import nodemailer from 'nodemailer';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Registration request received');
    const body = await request.json();
    console.log('Registration request body:', body);
    
    const validatedData = registerSchema.parse(body);
    console.log('Validation passed for:', validatedData.email);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      console.log('User already exists:', validatedData.email);
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate verification token
    const verificationToken = generateToken();

    // Create user
    try {
      console.log('Creating user in database:', validatedData.email);
      const user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          verificationToken,
        },
      });
      console.log('User created successfully:', user.id);

      // In development, auto-verify the email
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Auto-verifying email for:', user.email);
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      } else {
        // Send verification email in production
        try {
          console.log('Sending verification email to:', user.email);
          await sendVerificationEmail(user.email, verificationToken);
          console.log('Verification email sent successfully');
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          // Continue even if email sending fails
        }
      }

      return NextResponse.json(
        { 
          message: 'User registered successfully. Please verify your email.',
          userId: user.id,
          development: process.env.NODE_ENV !== 'production'
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      throw dbError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }

    console.error('Registration error:', error);
    // Add more detailed error information
    const errorMessage = error instanceof Error 
      ? `Registration error: ${error.message}` 
      : 'An error occurred during registration';
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify your email address</h2>
        <p>Thank you for registering with VowSwap. Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
        <p>If you didn't create an account with VowSwap, you can safely ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  });
}

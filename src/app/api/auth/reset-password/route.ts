import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Find user with valid reset token and include password history
    const user = await prisma.user.findFirst({
      where: {
        resetToken: validatedData.token,
        resetTokenExpiry: { gt: new Date() }
      },
      select: {
        id: true,
        password: true,
        passwordHistory: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired reset token',
          message: 'Invalid or expired reset token'
        }, 
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.password);

     // Check against all previous passwords (case-sensitive exact match)
     const isPasswordUsed = user.passwordHistory?.some(
      prevHash => prevHash === hashedPassword
    );

    if (isPasswordUsed) {
      return NextResponse.json(
        { error: 'Password previously used. Please choose a new password.' },
        { status: 400 }
      );
    }

    // Update password and maintain history
    await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordHistory: {
        // Handle null/undefined case and ensure array type
        set: [...(user.passwordHistory || []), hashedPassword].slice(-5)
      },
      resetToken: null,
      resetTokenExpiry: null
    }
  });

    return NextResponse.json(
      { success: true, message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: error.errors[0].message,
        message: error.errors[0].message 
      }, { status: 400 });
    }

    console.error('Password reset error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during password reset',
        message: 'An error occurred during password reset' 
      },
      { status: 500 }
    );
  }
}

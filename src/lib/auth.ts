import { compare, hash } from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  // Remove PrismaAdapter for now to avoid type issues
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  providers: [
    // EmailProvider temporarily disabled due to missing configuration
    // To enable, add proper SMTP server credentials in .env file
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: Number(process.env.EMAIL_SERVER_PORT),
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    // }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Email verification check temporarily disabled since EmailProvider is disabled
        // if (!user.emailVerified) {
        //   throw new Error('Email not verified. Please check your inbox.');
        // }

        // Return only the fields that are compatible with the User type
        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          emailVerified: user.emailVerified || undefined, // Convert null to undefined to match NextAuth types
          image: user.image || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        
        // Fetch user from database to get seller information
        const user = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: {
            isSeller: true,
            sellerApproved: true,
            shopName: true,
            sellerRating: true,
            sellerRatingsCount: true,
            sellerSince: true,
          },
        });
        
        if (user) {
          session.user.isSeller = user.isSeller;
          session.user.sellerApproved = user.sellerApproved;
          session.user.shopName = user.shopName || undefined;
          session.user.sellerRating = user.sellerRating || undefined;
          session.user.sellerRatingsCount = user.sellerRatingsCount;
          session.user.sellerSince = user.sellerSince ? user.sellerSince.toISOString() : undefined;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
};

// Helper functions for authentication
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Function to generate a random token
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Function to check if a user is authenticated
export async function isAuthenticated(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    // Email verification check temporarily disabled
    return !!user; // Only check if user exists, not if email is verified
  } catch (error) {
    return false;
  }
}

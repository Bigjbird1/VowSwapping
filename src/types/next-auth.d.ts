import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isSeller?: boolean;
      sellerApproved?: boolean;
      shopName?: string;
      sellerRating?: number;
      sellerRatingsCount?: number;
      sellerSince?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    emailVerified?: Date;
    image?: string;
    isSeller?: boolean;
    sellerApproved?: boolean;
    shopName?: string;
    shopDescription?: string;
    sellerRating?: number;
    sellerRatingsCount?: number;
    sellerSince?: Date;
    sellerBio?: string;
    sellerLogo?: string;
    sellerBanner?: string;
    sellerSocial?: any;
  }
}

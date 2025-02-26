# Deploying VowSwap to Vercel

This guide provides instructions for deploying the VowSwap application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A PostgreSQL database (e.g., from [Supabase](https://supabase.com), [Railway](https://railway.app), [Neon](https://neon.tech), etc.)
3. (Optional) An SMTP service for email functionality (e.g., [SendGrid](https://sendgrid.com), [Mailgun](https://www.mailgun.com), etc.)

## Setup Steps

### 1. Set Up a PostgreSQL Database

You'll need a PostgreSQL database for production. Here are some options:

- **Supabase**: Offers a generous free tier with PostgreSQL
- **Railway**: Simple setup with reasonable free tier
- **Neon**: Serverless PostgreSQL with a free tier
- **Vercel Postgres**: Integrated with Vercel (paid)

After setting up your database, you'll need the connection string, which typically looks like:
```
postgresql://username:password@hostname:port/database
```

### 2. Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to your Vercel account
3. Click "Add New" > "Project"
4. Import your Git repository
5. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `npx prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 3. Set Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Your PostgreSQL connection string | `postgresql://user:password@host:port/database` |
| `NEXTAUTH_URL` | Your application URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | A secret key for NextAuth.js | Generate a random string |
| `NEXT_PUBLIC_SITE_URL` | Your application URL | `https://your-app.vercel.app` |
| `EMAIL_SERVER_HOST` | SMTP server host | `smtp.example.com` |
| `EMAIL_SERVER_PORT` | SMTP server port | `587` |
| `EMAIL_SERVER_USER` | SMTP server username | `user@example.com` |
| `EMAIL_SERVER_PASSWORD` | SMTP server password | `your-password` |
| `EMAIL_FROM` | Email sender address | `noreply@vowswap.com` |

### 4. Deploy and Run Database Migrations

After configuring the environment variables, deploy your application:

1. Click "Deploy" in the Vercel dashboard
2. Once deployed, you need to run database migrations

You can run migrations using the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Run migrations
vercel run npx prisma migrate deploy
```

Alternatively, you can set up a post-deployment hook in your `package.json`:

```json
"scripts": {
  "vercel-build": "prisma generate && prisma migrate deploy && next build"
}
```

And update the build command in Vercel to `npm run vercel-build`.

## Troubleshooting

### Database Connection Issues

- Ensure your database allows connections from Vercel's IP addresses
- Check that your connection string is correct
- Verify that the database user has the necessary permissions

### Build Errors

- Check the build logs in Vercel for specific errors
- Ensure all dependencies are correctly installed
- Verify that environment variables are set correctly

### Runtime Errors

- Check the function logs in Vercel
- Ensure your database schema is up to date
- Verify that your application can connect to the database

## Monitoring and Scaling

- Use Vercel Analytics to monitor your application
- Set up logging with a service like [Sentry](https://sentry.io)
- Consider upgrading your database plan as your application grows

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

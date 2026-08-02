This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The home page lives at `app/(marketing)/page.tsx`; the page auto-updates as you edit the file.

### App Router layout (route groups)

The `app/` directory is organised by **route groups** (parenthesised folders) so
the file system mirrors the application structure, not just the URL path. URL
paths are unaffected by the grouping.

```
src/app/
├── (marketing)/           # Public, unauthenticated marketing pages
│   ├── page.tsx           # /
│   └── about/             # /about
├── (auth)/                # Authentication pages
│   ├── login/             # /login
│   └── register/          # /register
├── (protected)/           # Authenticated app pages
│   ├── podcasts/          # /podcasts
│   └── add-podcast/       # /add-podcast
├── auth/                  # Auth-fallback pages (/auth/unauthorized, etc.)
├── api/                   # API route handlers
├── layout.tsx             # Root layout
└── providers.tsx          # Client providers
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

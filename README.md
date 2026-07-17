# MakeMistakes Platform

MakeMistakes is a production-ready AI-guided Developer Learning Platform where coding mistakes are captured, analyzed, and turned into personalized interactive learning opportunities.

## Monorepo Architecture

This workspace is structured as a dual-service monorepo:
* **`/backend`**: Express.js, TypeScript, PostgreSQL, Prisma ORM, JWT, and cookies.
* **`/frontend`**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, and GSAP.

## Getting Started

### Prerequisites
* **Node.js** (v20+ recommended, v25.6.1 verified)
* **npm** (v10+)
* **PostgreSQL 17** (Running on port 5432)

### Backend Installation & Setup
1. Navigate to `/backend`.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example` and set your variables.
4. Run `npx prisma migrate dev --name init` to sync your PostgreSQL database.
5. Start development server using `npm run dev`.

### Frontend Installation & Setup
1. Navigate to `/frontend`.
2. Run `npm install`.
3. Start development server using `npm run dev`.

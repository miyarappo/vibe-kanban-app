# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` - Runs Next.js development server on http://localhost:3000
- **Build for production**: `npm run build` - Creates optimized production build
- **Start production server**: `npm start` - Runs production build locally
- **Lint code**: `npm run lint` - Runs ESLint to check code quality

## Database Operations

- **Start PostgreSQL database**: `docker-compose up -d` - Starts PostgreSQL container in background
- **Apply migrations**: `npx prisma migrate dev` - Apply pending migrations and generate client
- **Reset database**: `npx prisma migrate reset` - Reset database and apply all migrations
- **Generate Prisma client**: `npx prisma generate` - Regenerate Prisma client after schema changes
- **Open Prisma Studio**: `npx prisma studio` - Visual database browser on http://localhost:5555

## Architecture Overview

This is a Kanban board application built with:

### Core Stack
- **Next.js 15** with App Router - React framework for the frontend and API routes
- **TypeScript** - Type safety throughout the application
- **Prisma ORM** - Database ORM with PostgreSQL as the database
- **Tailwind CSS v4** - Utility-first CSS framework for styling

### UI Components
- **shadcn/ui** - Component library configured with "new-york" style
- **Lucide React** - Icon library
- **@dnd-kit/sortable** - Drag and drop functionality for kanban cards
- **Class Variance Authority (CVA)** - For component variant management

### Database Schema
The application uses a hierarchical structure:
- **Board** - Top-level container for kanban boards
- **Column** - Vertical sections within a board (e.g., "To Do", "In Progress", "Done")
- **Task** - Individual cards within columns with priority levels and due dates

Key relationships:
- Board → Column (one-to-many with cascade delete)
- Column → Task (one-to-many with cascade delete)
- Tasks have position-based ordering within columns
- Columns have position-based ordering within boards

### Database Configuration
- PostgreSQL runs in Docker container on port 5432
- Database connection via `DATABASE_URL` environment variable
- Default credentials: user/password (development only)

### Component Architecture
- Uses shadcn/ui component library with path aliases configured
- Component imports use `@/components`, `@/lib`, `@/hooks` aliases
- Utility function `cn()` in `lib/utils.ts` for conditional className merging
- CSS variables enabled for theming support

### Development Notes
- Font: Geist Sans and Geist Mono from Google Fonts
- Base color scheme: neutral with CSS variables for theming
- Tailwind configuration includes custom animations via tw-animate-css
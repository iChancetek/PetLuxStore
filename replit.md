# The PotLuxE - Premium Pet E-Commerce Platform

## Overview

The PotLuxE is a production-ready pet e-commerce platform built as a full-stack web application with modern React frontend and Express backend. The application features AI-powered product recommendations, personalized shopping experiences, and comprehensive e-commerce functionality including cart management, checkout processing, and administrative tools. The platform is designed to provide a premium shopping experience for pet owners with intelligent product discovery and AI-driven customer assistance.

## Recent Changes (January 12, 2026)

- **CSRF Protection System**: Comprehensive CSRF protection for all mutating API endpoints
  - Global middleware issues tokens to all visitors on first request
  - Bootstrap endpoint (`GET /api/csrf`) for mobile/CLI clients
  - All POST/PUT/PATCH/DELETE require valid x-csrf-token header
  - Frontend apiRequest() automatically includes CSRF token
  - Exempt list limited to: bootstrap auth flows (signin, signup, etc.) and webhooks

## Previous Changes (October 30, 2025)

- **MAJOR: Custom Authentication System (Backend Complete)**: Built production-ready custom auth to replace Clerk
  - Argon2id password hashing with secure parameters (64MB memory, timeCost 3)
  - SHA-256 hashed session/refresh/verification/reset tokens (database leak protection)
  - Email verification and password reset flows with secure one-time tokens
  - Rate limiting and brute force protection (account lockouts after 5 failed attempts)
  - HTTPOnly cookies with SameSite=strict for CSRF protection
  - Comprehensive audit logging for all auth events
  - API routes: /api/auth/signup, /signin, /signout, /verify-email, /reset-password
  - Running alongside Clerk (gradual migration planned)
- **CRITICAL FIX - Mobile Authentication**: Fixed production authentication for www.thepotluxe.com - frontend now correctly detects all thepotluxe.com domains (including www) and uses live Clerk keys
- **Enhanced AI Chat Formatting**: AI Assistant now properly renders markdown with bold headings, bullet points, and section spacing (removes # symbols)
- **Auto-Fix Stale Authentication Cookies**: Added automatic detection and clearing of stale Clerk session cookies for mobile browser compatibility
- **Fixed Guest Cart Reactivity**: Resolved issue where cart count wasn't updating immediately after adding items for guest users

## User Preferences

**Communication Style:**
- Use simple, everyday language
- Format responses with bullet points and bold headings
- Add spacing between sections for readability
- Keep responses concise and scannable
- Avoid filler content - deliver value quickly
- Use consistent, professional formatting

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using functional components and hooks
- **Routing**: Wouter for client-side routing with protected routes for authenticated users
- **State Management**: TanStack Query (React Query) for server state management and API data fetching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Build System**: Vite for fast development and optimized production builds
- **Authentication Flow**: Clerk authentication with automatic environment-based key selection (test keys for dev, live keys for production)

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for type safety and modern JavaScript features
- **API Design**: RESTful API endpoints with consistent JSON responses and error handling
- **Authentication**: Clerk authentication with automatic environment-based key selection for development and production
- **Guest Cart Support**: Full cart functionality for unauthenticated users using localStorage with automatic merge on sign-in

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon for production scalability
- **ORM**: Drizzle ORM with TypeScript schema definitions for type-safe database operations
- **Schema Design**: Relational model with tables for users, products, categories, cart items, orders, reviews, and AI interactions
- **Migration System**: Drizzle Kit for database schema migrations and version control

### AI Integration
- **Provider**: OpenAI GPT models for natural language processing
- **Features**: Product description generation, personalized recommendations, search query enhancement, and conversational chat assistant
- **Implementation**: Server-side AI service layer with structured prompt engineering and response formatting

### External Dependencies
- **Payment Processing**: Stripe integration for secure payment handling and subscription management
- **Authentication**: Clerk for OAuth-based user authentication with production domain support
- **Database Hosting**: Neon PostgreSQL for managed database infrastructure
- **AI Services**: OpenAI API for generative AI capabilities
- **UI Components**: Radix UI for accessible, unstyled component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Environment Configuration

### Development (Replit workspace)
- Uses test Clerk keys (CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY)
- Test Stripe keys for payment testing
- Development database instance

### Production (thepotluxe.com)
- Automatically switches to live Clerk keys (CLERK_LIVE_SECRET_KEY, VITE_CLERK_LIVE_PUBLISHABLE_KEY)
- Live Stripe keys for real payments
- Production database with full data persistence
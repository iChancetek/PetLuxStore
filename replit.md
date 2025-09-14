# The PotLuxE - Premium Pet E-Commerce Platform

## Overview

The PotLuxE is a production-ready pet e-commerce platform built as a full-stack web application with modern React frontend and Express backend. The application features AI-powered product recommendations, personalized shopping experiences, and comprehensive e-commerce functionality including cart management, checkout processing, and administrative tools. The platform is designed to provide a premium shopping experience for pet owners with intelligent product discovery and AI-driven customer assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using functional components and hooks
- **Routing**: Wouter for client-side routing with protected routes for authenticated users
- **State Management**: TanStack Query (React Query) for server state management and API data fetching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Build System**: Vite for fast development and optimized production builds
- **Authentication Flow**: Replit Auth integration with session-based authentication

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for type safety and modern JavaScript features
- **API Design**: RESTful API endpoints with consistent JSON responses and error handling
- **Authentication**: Replit Auth with OpenID Connect (OIDC) strategy using Passport.js
- **Session Management**: Express sessions with PostgreSQL session store for persistence

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
- **Authentication**: Replit Auth for OAuth-based user authentication
- **Database Hosting**: Neon PostgreSQL for managed database infrastructure
- **AI Services**: OpenAI API for generative AI capabilities
- **UI Components**: Radix UI for accessible, unstyled component primitives
- **Styling**: Tailwind CSS for utility-first styling approach
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
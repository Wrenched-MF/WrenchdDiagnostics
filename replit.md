# Wrench'd IVHC Application

## Overview

This is a full-stack web application for Wrench'd IVHC (Independent Vehicle Health Check), built with a modern React frontend and Express.js backend. The application provides professional vehicle inspection services optimized for tablet use by mechanics, featuring user authentication, subscription management, and comprehensive admin capabilities.

**Current Status**: Complete job management system implemented with real DVLA API integration for vehicle registration lookup, UK postcode validation, comprehensive workflow tracking from vehicle lookup to customer data collection, and PWA capability with app icons for tablet installation. Authentication issues resolved - all API endpoints now work properly with session-based authentication.

## User Preferences

- **Communication style**: Simple, everyday language
- **App Design**: Black and green gradient theme throughout the application
- **Target Device**: Tablet-optimized interface (iPad-friendly)
- **User Base**: Professional mechanics requiring efficient workflow tools
- **Development Approach**: Step-by-step implementation maintaining clean backend architecture

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query** for server state management and API caching
- **Tailwind CSS** with **shadcn/ui** component library for styling
- **React Hook Form** with **Zod** for form handling and validation

### Backend Architecture
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations with PostgreSQL
- **Neon Database** as the PostgreSQL provider
- **Replit Auth** with OpenID Connect for authentication
- **Passport.js** for authentication middleware
- **Express Session** with PostgreSQL session storage

### Key Design Decisions

**Monorepo Structure**: The application uses a shared folder structure with `client/`, `server/`, and `shared/` directories. This allows for code sharing between frontend and backend, particularly for TypeScript types and database schemas.

**Database Choice**: PostgreSQL was chosen for its reliability and ACID compliance, which is crucial for handling user data and subscription information. Drizzle ORM provides type-safe database operations.

**Authentication Strategy**: Replit Auth was implemented to leverage the platform's built-in user management, reducing complexity while maintaining security.

**UI Framework**: shadcn/ui was selected over other component libraries because it provides high-quality, customizable components that can be copied into the project, giving full control over styling and behavior.

## Key Components

### Database Schema
- **sessions**: Session storage for authentication (required by Replit Auth)
- **users**: User profiles with role-based access (user/admin), approval status, and Stripe integration
- **subscriptions**: Subscription management with Stripe integration
- **vehicles**: Vehicle registry storing permanent DVLA data (VRM, make, year, technical specs)
- **customers**: Customer registry with contact details and address information
- **vehicleCustomers**: Vehicle-customer relationships tracking ownership history and transfers
- **jobs**: Vehicle inspection jobs linking vehicles to customers via foreign keys
- **inspectionReports**: Vehicle inspection data storage linked to jobs

### Authentication System
- OpenID Connect integration with Replit
- Role-based access control (user/admin)
- User approval workflow for admin oversight
- Session management with PostgreSQL storage

### User Interface
- **Loading Page**: Animated loading screen with system initialization
- **Home Page**: Main dashboard for authenticated users
- **Admin Dashboard**: User management interface for administrators
- Responsive design with mobile support

### API Structure
- `/api/auth/*`: Authentication endpoints
- `/api/admin/*`: Admin-only endpoints for user management
- `/api/user/*`: User-specific endpoints for reports and data
- `/api/jobs/*`: Job management endpoints for vehicle inspections
- `/api/dvla/lookup`: Real DVLA API integration for vehicle registration data
- `/api/postcode/lookup`: UK postcode validation and address lookup

## Data Flow

1. **Authentication**: Users authenticate through Replit's OpenID Connect provider
2. **Session Management**: Sessions are stored in PostgreSQL with automatic expiration
3. **User Management**: Admins can approve users and manage roles through the admin dashboard
4. **Subscription Flow**: Integration with Stripe for payment processing (infrastructure prepared)
5. **Inspection Reports**: Users can create and manage vehicle inspection reports

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting with serverless scaling
- **Replit Auth**: OpenID Connect authentication provider
- **Stripe**: Payment processing (integrated but not fully implemented)
- **DVLA API**: Official UK vehicle registration data lookup service
- **Postcodes.io**: Free UK postcode validation and address lookup API

### Frontend Libraries
- **Radix UI**: Accessible component primitives for shadcn/ui
- **Lucide React**: Icon library
- **date-fns**: Date manipulation utilities
- **clsx**: Conditional CSS class management

### Backend Libraries
- **@neondatabase/serverless**: Neon database client with WebSocket support
- **connect-pg-simple**: PostgreSQL session store
- **memoizee**: Function memoization for performance

## Deployment Strategy

### Development
- **Vite Dev Server**: Hot module replacement for frontend development
- **TSX**: TypeScript execution for backend development
- **Concurrent Development**: Both frontend and backend run simultaneously

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database Migrations**: Drizzle Kit manages schema changes
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, and REPL_ID required

### Replit Integration
- Custom Vite plugin for error overlay in development
- Cartographer plugin for Replit-specific development features
- Development banner for external access

The application is designed to run efficiently on Replit's infrastructure while maintaining the flexibility to deploy elsewhere if needed.
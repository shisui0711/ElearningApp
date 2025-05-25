# E-Learning Application

A modern, feature-rich e-learning platform built with Next.js, Prisma, PostgreSQL, and TypeScript.

## Features

- **User Management**: Student, teacher, and admin roles with different privileges
- **Course Management**: Create, edit, and delete courses with lessons, documents, and videos
- **Forums**: Discussion boards for courses and general topics
- **Interactive Exams**: Create and take exams with automatic grading
- **Assignments**: Create, submit and grade assignments
- **Analytics Dashboard**: Comprehensive data visualization tools for administrators
- **Notifications**: Real-time notifications for users
- **Responsive Design**: Modern UI design that works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI with custom components
- **Backend**: Next.js API Routes, Socket.io for real-time features
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom auth system using Lucia
- **Containerization**: Docker and Docker Compose
- **Charts & Visualization**: Recharts

## Getting Started

### Prerequisites

- Node.js 20+ 
- PNPM package manager
- PostgreSQL database

### Environment Setup

1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:

```
POSTGRES_PRISMA_URL=postgresql://postgres:123@localhost:5432/elearning?schema=public
POSTGRES_PRISMA_URL_NON_POOLING=postgresql://postgres:123@localhost:5432/elearning?schema=public
```

### Installation and Setup

```bash
# Install dependencies
pnpm install

# Push database schema and seed data
pnpm prisma db push
pnpm seed

# Start the development server
pnpm dev

# Start the websocket server (in a separate terminal)
pnpm dev:socket
```

The application will run at [http://localhost:3000](http://localhost:3000).

### Docker Setup

You can also run the application using Docker:

```bash
# Build and start containers
docker-compose up -d

# Initialize database
docker-compose exec app pnpm prisma migrate deploy
docker-compose exec app pnpm seed
```

See [Docker-README.md](./Docker-README.md) for more details.

## Project Structure

- `app/`: Next.js app router pages and layouts
  - `(main)/`: Main application routes
  - `(auth)/`: Authentication routes
  - `api/`: API endpoints
- `components/`: React components
  - `ui/`: Reusable UI components
  - `courses/`: Course-related components
  - `analytics/`: Analytics dashboard components
- `lib/`: Utility functions and modules
- `prisma/`: Database schema and seed data
- `hooks/`: Custom React hooks
- `types/`: TypeScript type definitions
- `public/`: Static files
- `provider/`: Context providers

## Main Features

### Authentication System

- Custom authentication using Lucia
- Role-based access control (RBAC)

### Course Platform

- Interactive video lessons
- Document uploads and management
- Course progress tracking
- Course ratings and comments

### Exam System

- Create multiple-choice and open-ended questions
- Automated grading
- Performance analytics

### Analytics

The platform includes a comprehensive analytics system for administrators:
- User growth tracking
- Course completion rates
- Exam performance metrics
- Department statistics

See [ANALYTICS_README.md](./ANALYTICS_README.md) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 
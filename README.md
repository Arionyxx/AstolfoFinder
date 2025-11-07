# Full-Stack Monorepo

A modern full-stack application with Node.js backend and React frontend, scaffolded with best practices for development workflow and tooling.

## 📦 Project Structure

```
.
├── server/                # Node.js + Express backend
│   ├── src/              # TypeScript source code
│   ├── prisma/           # Prisma schema and migrations
│   ├── .env.example      # Environment variables template
│   ├── tsconfig.json     # TypeScript configuration
│   ├── package.json      # Backend dependencies
│   └── README.md         # Backend-specific documentation
├── client/               # React + Vite frontend
│   ├── src/              # TypeScript + React components
│   ├── index.html        # HTML entry point
│   ├── .env.example      # Environment variables template
│   ├── tailwind.config.js # TailwindCSS configuration
│   ├── vite.config.ts    # Vite configuration
│   ├── package.json      # Frontend dependencies
│   └── README.md         # Frontend-specific documentation
├── tsconfig.base.json    # Shared TypeScript configuration
├── package.json          # Root package.json with workspaces
└── README.md             # This file
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Environment**: dotenv for configuration
- **Development**: ts-node-dev for fast reloading
- **Linting**: ESLint + Prettier

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **Linting**: ESLint + Prettier

### Shared Tools
- **Package Manager**: Yarn (v3+)
- **Monorepo**: Yarn Workspaces
- **Git Hooks**: Husky (pre-commit)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- Yarn 3.x or higher
- PostgreSQL (for database)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd monorepo-full-stack
```

2. Install dependencies (in root directory)
```bash
yarn install
```

3. Setup environment variables

Backend:
```bash
cp server/.env.example server/.env
# Edit server/.env with your database credentials
```

Frontend:
```bash
cp client/.env.example client/.env
# Edit client/.env if needed
```

### Database Setup (Backend)

1. Create a PostgreSQL database:
```bash
createdb monorepo_db
```

2. Run Prisma migrations:
```bash
yarn workspace @monorepo/server run migrate
```

This will create the database schema based on `prisma/schema.prisma`.

### Development

Start both backend and frontend in development mode:
```bash
yarn dev
```

Or start them individually:

**Terminal 1 - Backend:**
```bash
yarn workspace @monorepo/server dev
```
The backend will start at `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
yarn workspace @monorepo/client dev
```
The frontend will start at `http://localhost:5173`

### Building

Build both projects:
```bash
yarn build
```

Build specific project:
```bash
yarn workspace @monorepo/server build
yarn workspace @monorepo/client build
```

### Production

Start the built backend server:
```bash
yarn start
```

Preview the built frontend:
```bash
yarn workspace @monorepo/client preview
```

## 🔧 Development Commands

### Linting

Lint all workspaces:
```bash
yarn lint
```

Fix linting issues:
```bash
yarn lint:fix
```

### Code Formatting

Format all code:
```bash
yarn format
```

Check formatting without changes:
```bash
yarn format:check
```

### Type Checking

Run TypeScript type checks:
```bash
yarn type-check
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/monorepo_db
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🔌 API Integration

The frontend is configured with a proxy to the backend:
- API calls to `/api/*` are forwarded to `http://localhost:5000`
- Direct fetch calls should use `http://localhost:5000` (development) or your production API URL

Example:
```typescript
// Frontend
const response = await fetch('http://localhost:5000/health');
```

## 📚 Backend Structure

- `/src` - TypeScript source code
  - `index.ts` - Express server entry point
- `/prisma` - Prisma ORM configuration
  - `schema.prisma` - Database schema
  - `/migrations` - Generated migration files

### Database Models

Models are defined in `server/prisma/schema.prisma`. Example:
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Endpoints

- `GET /health` - Health check endpoint returns server status

## 📚 Frontend Structure

- `/src` - React source code
  - `App.tsx` - Main App component with routing
  - `main.tsx` - React entry point
  - `index.css` - Global styles with TailwindCSS
  - `/pages` - Page components
- `index.html` - HTML template
- `tailwind.config.js` - TailwindCSS configuration
- `vite.config.ts` - Vite build configuration

### Adding New Pages

1. Create a new component in `src/pages/YourPage.tsx`
2. Add a route in `src/App.tsx`:
```typescript
import YourPage from './pages/YourPage';

// In the Routes component:
<Route path="/your-path" element={<YourPage />} />
```

## 🐛 Git Hooks

Pre-commit hooks are configured with Husky to:
- Run ESLint and fix issues
- Format code with Prettier

Hooks run automatically on `git commit`.

To bypass hooks (not recommended):
```bash
git commit --no-verify
```

## 🔄 Database Migrations

### Create a migration

```bash
yarn workspace @monorepo/server run migrate
# Follow prompts to name your migration
```

### Deploy migrations

```bash
yarn workspace @monorepo/server run migrate:deploy
```

### Generate Prisma Client

```bash
yarn workspace @monorepo/server run prisma:generate
```

## 📦 Adding Dependencies

Add to backend:
```bash
yarn workspace @monorepo/server add <package-name>
```

Add to frontend:
```bash
yarn workspace @monorepo/client add <package-name>
```

Add to both:
```bash
yarn add -W <package-name>
```

## 🚢 Deployment

### Backend Deployment

1. Build the project:
```bash
yarn workspace @monorepo/server build
```

2. Deploy the `dist/` directory with `node dist/index.js`

### Frontend Deployment

1. Build the project:
```bash
yarn workspace @monorepo/client build
```

2. Deploy the `dist/` directory to your static hosting (Vercel, Netlify, etc.)

3. Update `VITE_API_URL` environment variable to point to your production backend

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

MIT

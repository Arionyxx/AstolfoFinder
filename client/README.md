# Frontend - React + Vite

A modern React frontend built with Vite, TypeScript, TailwindCSS, and React Router.

## 📋 Setup

### Install Dependencies

From the root directory:
```bash
yarn install
```

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` if needed:
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Development

Start the development server:
```bash
yarn dev
```

The frontend will start at `http://localhost:5173`

The dev server includes:
- Hot Module Replacement (HMR) for instant updates
- Proxy to backend at `http://localhost:5000`

## 🔨 Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build locally
- `yarn lint` - Check code with ESLint
- `yarn lint:fix` - Fix linting issues
- `yarn type-check` - Run TypeScript compiler

## 📁 Project Structure

```
client/
├── src/
│   ├── App.tsx            # Main App component with routing
│   ├── main.tsx           # React entry point
│   ├── index.css          # Global styles (Tailwind)
│   └── pages/
│       ├── Home.tsx       # Home page
│       └── ...            # Add more pages
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # TailwindCSS configuration
├── postcss.config.js      # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.json       # Prettier configuration
├── .env.example           # Environment variables template
└── package.json           # Dependencies and scripts
```

## 🎨 Styling

### TailwindCSS

Tailwind utility classes are available throughout your components:

```tsx
<div className="bg-white shadow-md rounded-lg p-8">
  <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
  <p className="text-gray-600">This is a styled component.</p>
</div>
```

### Global Styles

Global styles are in `src/index.css`. TailwindCSS directives are:
- `@tailwind base` - Base styles
- `@tailwind components` - Component classes
- `@tailwind utilities` - Utility classes

## 🔄 Routing

Routes are defined in `App.tsx` using React Router:

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}
```

### Adding a New Page

1. Create a new file in `src/pages/NewPage.tsx`:
```tsx
export default function NewPage(): JSX.Element {
  return <div>New Page</div>;
}
```

2. Import and add a route in `App.tsx`:
```tsx
import NewPage from './pages/NewPage';

// In Routes:
<Route path="/new" element={<NewPage />} />
```

## 🔌 API Communication

### Fetching Data

```tsx
import { useState, useEffect } from 'react';

export default function MyComponent(): JSX.Element {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/endpoint')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  return <div>{loading ? 'Loading...' : JSON.stringify(data)}</div>;
}
```

### Using Axios (Optional)

Install axios:
```bash
yarn workspace @monorepo/client add axios
```

Use in components:
```tsx
import axios from 'axios';

axios.get('http://localhost:5000/api/endpoint')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

## 📝 Code Style

- **Linting**: ESLint with React and React Hooks plugins
- **Formatting**: Prettier
- **Type Safety**: TypeScript strict mode
- **Pre-commit**: Husky hooks run lint and format on commit

Run linting:
```bash
yarn lint
```

Auto-fix linting issues:
```bash
yarn lint:fix
```

## 🏗️ Building

### Development Build

TypeScript will be checked during build:
```bash
yarn build
```

### Preview Production Build

Test the production build locally:
```bash
yarn preview
```

## 📦 Adding Dependencies

```bash
yarn workspace @monorepo/client add <package-name>
# or from client directory:
yarn add <package-name>
```

Add as dev dependency:
```bash
yarn workspace @monorepo/client add -D <package-name>
```

## 🚢 Deployment

### Build for Production

```bash
yarn build
```

This creates an optimized build in the `dist/` directory.

### Deploy to Hosting

Deploy the `dist/` directory to:
- **Vercel**: Connect your Git repository
- **Netlify**: Drag and drop `dist/` or connect Git
- **GitHub Pages**: Build and push `dist/` to gh-pages branch
- **Any static host**: Upload `dist/` contents

### Environment Variables for Production

Set `VITE_API_URL` to your production API URL before building:
```bash
VITE_API_URL=https://api.example.com yarn build
```

## 🔒 Security Notes

- Environment variables prefixed with `VITE_` are exposed to the browser
- Never put secrets in frontend environment variables
- Validate all user input
- Use HTTPS in production
- Keep dependencies updated

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use:
```bash
yarn dev -- --port 5174
```

### Backend CORS Issues

Make sure the backend CORS_ORIGIN environment variable matches your frontend URL:
```env
CORS_ORIGIN=http://localhost:5173
```

### Module Resolution Issues

Check that `vite.config.ts` paths are correct and TypeScript configuration is valid.

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

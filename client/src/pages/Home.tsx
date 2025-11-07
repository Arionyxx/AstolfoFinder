import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HealthStatus {
  status: string;
  timestamp: string;
}

export default function Home(): JSX.Element {
  const { user } = useAuth();
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect((): void => {
    const fetchHealth = async (): Promise<void> => {
      try {
        const response = await fetch('http://localhost:5000/health');
        if (!response.ok) {
          throw new Error('Failed to fetch health status');
        }
        const data: HealthStatus = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-8 py-12">
      <div className="bg-white shadow-md rounded-lg p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Full-Stack Monorepo
          </h2>
          {user && (
            <p className="text-gray-600 text-lg">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>
        <p className="text-gray-600 text-lg mb-6">
          This is a scaffolded full-stack application with Node.js backend and React frontend.
        </p>

        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Server Health Check
          </h3>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5 bg-blue-500 rounded-full" />
              <p className="text-gray-600">Checking server health...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : status ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 font-medium">
                ✓ Server is {status.status}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Last checked: {new Date(status.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Stack</h3>
          <ul className="grid grid-cols-2 gap-4">
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">React 18 + TypeScript</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">Vite</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">TailwindCSS</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">React Router</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">Express.js Backend</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-gray-700">Prisma ORM</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

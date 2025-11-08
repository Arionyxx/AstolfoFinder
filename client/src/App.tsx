import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileDemo from './pages/ProfileDemo';
import Matches from './pages/Matches';

export default function App(): JSX.Element {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Monorepo App</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Profile
                </Link>
                <Link
                  to="/matches"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Matches
                </Link>
                <Link
                  to="/demo"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Demo
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/demo" element={<ProfileDemo />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

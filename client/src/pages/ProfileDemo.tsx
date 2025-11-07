import ProfileEditor from '../components/ProfileEditor';

export default function ProfileDemo(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Profile Editor Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This is a demonstration of the multi-step profile editor. Click the "Complete Profile" 
            button below to start the profile creation process.
          </p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <ProfileEditor />
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Features Demonstrated
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Multi-step form with progress indicator
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Real-time form validation
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Avatar upload (placeholder)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Geolocation with manual override
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Hobby selection from API
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Responsive design
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
              Accessibility features
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
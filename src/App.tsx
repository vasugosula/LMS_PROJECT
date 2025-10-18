import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { LandingPage } from './pages/LandingPage';

function App() {
  const { user, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    if (!showAuth) {
      return <LandingPage onGetStarted={() => setShowAuth(true)} />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header onHomeClick={() => setShowAuth(false)} />
      {profile.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
}

export default App;

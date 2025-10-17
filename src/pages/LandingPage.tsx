import { GraduationCap, BookOpen, Trophy, MessageCircle, Users, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 animate-bounce-slow shadow-2xl">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white mb-4 animate-slide-up">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LearnHub</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 animate-slide-up-delay">
            Your comprehensive Learning Management System for modern education
          </p>
          <button
            onClick={onGetStarted}
            className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            {
              icon: BookOpen,
              title: 'Interactive Courses',
              description: 'Engage with rich multimedia content and assignments',
              color: 'from-blue-500 to-blue-600',
            },
            {
              icon: Trophy,
              title: 'Live Leaderboards',
              description: 'Track your progress and compete with peers',
              color: 'from-yellow-500 to-orange-500',
            },
            {
              icon: MessageCircle,
              title: 'Real-Time Chat',
              description: 'Connect with classmates and teachers instantly',
              color: 'from-green-500 to-teal-600',
            },
            {
              icon: Users,
              title: 'Collaborative Learning',
              description: 'Work together and share knowledge',
              color: 'from-purple-500 to-pink-600',
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-2xl mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-6 text-center">About LearnHub</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto mb-8">
            LearnHub is a modern Learning Management System designed to revolutionize education.
            We provide teachers and students with powerful tools for course management, assignment
            tracking, real-time collaboration, and performance analytics. Our platform combines
            cutting-edge technology with intuitive design to create an engaging learning experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                1000+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent mb-2">
                100+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Expert Teachers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Courses Available</div>
            </div>
          </div>
        </div>

        <div className="text-center animate-fade-in">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Ready to Transform Your Learning Experience?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Join thousands of students and teachers already using LearnHub</p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            Start Learning Today
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.8s ease-out;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.8s ease-out 0.2s backwards;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .animate-bounce-slow {
          animation: bounceSlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

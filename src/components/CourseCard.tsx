import { Users, BookOpen } from 'lucide-react';

interface CourseCardProps {
  title: string;
  description: string;
  teacherName?: string;
  enrollmentCount?: number;
  thumbnail?: string;
  onClick?: () => void;
}

export function CourseCard({
  title,
  description,
  teacherName,
  enrollmentCount = 0,
  thumbnail,
  onClick
}: CourseCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      <div className="h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          {teacherName && (
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{teacherName}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{enrollmentCount} enrolled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

interface CourseChatProps {
  courseId: string;
}

export function CourseChat({ courseId }: CourseChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          profiles:user_id (name, role)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames = (data || []).map(msg => ({
        ...msg,
        user_name: msg.profiles?.name || 'Unknown',
        user_role: msg.profiles?.role || 'student',
      }));

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`course_chat_${courseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_posts',
          filter: `course_id=eq.${courseId}`,
        },
        async (payload) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', payload.new.user_id)
            .maybeSingle();

          const newMsg = {
            ...payload.new,
            user_name: profileData?.name || 'Unknown',
            user_role: profileData?.role || 'student',
          } as Message;

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('forum_posts').insert({
        course_id: courseId,
        user_id: user?.id!,
        message: newMessage,
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col h-[600px]">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Course Discussion</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Chat with enrolled students and teacher
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    {!isOwnMessage && (
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {msg.user_name}
                    </span>
                    {msg.user_role === 'teacher' && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                        Teacher
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-white"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

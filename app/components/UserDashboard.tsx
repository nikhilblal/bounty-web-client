'use client';

import { useState, useEffect } from 'react';
import { db, getDocs, collection, query, where } from '../../firebase';
import { useAuth } from '../context/AuthContext';

interface Task {
  id: string;
  title: string;
  description: string;
  posterId: string;
  posterName: string;
  posterAvatar?: string;
  doerId?: string;
  doerName?: string;
  validatorId?: string;
  bounty: number;
  status: 'open' | 'claimed' | 'completed' | 'validated';
  proofUrl?: string;
  location?: string;
  category?: string;
  imageUrl?: string;
  createdAt: any;
}

interface UserStats {
  totalEarned: number;
  tasksCompleted: number;
  tasksPosted: number;
  tasksValidated: number;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalEarned: 0,
    tasksCompleted: 0,
    tasksPosted: 0,
    tasksValidated: 0
  });
  const [userTasks, setUserTasks] = useState<{
    posted: Task[];
    claimed: Task[];
    completed: Task[];
  }>({
    posted: [],
    claimed: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'posted' | 'claimed' | 'completed'>('overview');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch tasks posted by user
      const postedQuery = query(collection(db, 'tasks'), where('posterId', '==', user.uid));
      const postedSnapshot = await getDocs(postedQuery);
      const postedTasks = postedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      // Fetch tasks claimed by user
      const claimedQuery = query(collection(db, 'tasks'), where('doerId', '==', user.uid));
      const claimedSnapshot = await getDocs(claimedQuery);
      const claimedTasks = claimedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      // Fetch tasks validated by user
      const validatedQuery = query(collection(db, 'tasks'), where('validatorId', '==', user.uid));
      const validatedSnapshot = await getDocs(validatedQuery);
      const validatedTasks = validatedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];

      // Calculate stats
      const completedTasks = claimedTasks.filter(task => task.status === 'validated');
      const totalEarned = completedTasks.reduce((sum, task) => sum + task.bounty, 0);

      setStats({
        totalEarned,
        tasksCompleted: completedTasks.length,
        tasksPosted: postedTasks.length,
        tasksValidated: validatedTasks.length
      });

      setUserTasks({
        posted: postedTasks,
        claimed: claimedTasks.filter(task => ['claimed', 'completed'].includes(task.status)),
        completed: completedTasks
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500">
        Sign in to view your dashboard
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'claimed': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'validated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'design': return '🎨';
      case 'development': return '💻';
      case 'writing': return '✍️';
      case 'research': return '🔍';
      case 'marketing': return '📢';
      case 'data-entry': return '📊';
      case 'physical': return '🏃';
      default: return '📝';
    }
  };

  const renderTaskList = (tasks: Task[]) => (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="bg-white border rounded-lg overflow-hidden">
          {task.imageUrl && (
            <div className="aspect-video w-full h-32">
              <img 
                src={task.imageUrl} 
                alt={task.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">
                    {getCategoryIcon(task.category || 'general')}
                  </span>
                  <h4 className="font-medium">{task.title}</h4>
                  {task.location && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      📍 {task.location}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{task.description}</p>
                {task.doerName && task.doerName !== user?.displayName && (
                  <p className="text-xs text-gray-500">Claimed by: {task.doerName}</p>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-semibold text-green-600">
                  {task.bounty} pts
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>
            
            {task.proofUrl && (
              <a 
                href={task.proofUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View proof
              </a>
            )}
          </div>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <img 
          src={user.photoURL || '/default-avatar.png'} 
          alt="Profile" 
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {stats.totalEarned}
          </div>
          <div className="text-sm text-gray-600">Points Earned</div>
        </div>
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.tasksCompleted}
          </div>
          <div className="text-sm text-gray-600">Tasks Completed</div>
        </div>
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {stats.tasksPosted}
          </div>
          <div className="text-sm text-gray-600">Tasks Posted</div>
        </div>
        <div className="bg-white border rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {stats.tasksValidated}
          </div>
          <div className="text-sm text-gray-600">Tasks Validated</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'posted', label: `Posted (${userTasks.posted.length})` },
            { key: 'claimed', label: `In Progress (${userTasks.claimed.length})` },
            { key: 'completed', label: `Completed (${userTasks.completed.length})` }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Posted Tasks</h3>
              {renderTaskList(userTasks.posted.slice(0, 3))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Tasks in Progress</h3>
              {renderTaskList(userTasks.claimed.slice(0, 3))}
            </div>
          </div>
        )}
        {activeTab === 'posted' && renderTaskList(userTasks.posted)}
        {activeTab === 'claimed' && renderTaskList(userTasks.claimed)}
        {activeTab === 'completed' && renderTaskList(userTasks.completed)}
      </div>
    </div>
  );
}
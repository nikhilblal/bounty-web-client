'use client';

import { useState, useEffect } from 'react';
import { db, getDocs, collection } from '../../firebase';
import { useAuth } from '../context/AuthContext';

interface LeaderboardUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  pointsEarned: number;
  tasksCompleted: number;
  tasksPosted: number;
  pointsStacked: number;
  tasksStacked: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [sortBy, setSortBy] = useState<'total' | 'earned' | 'stacked'>('total');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, sortBy]);

  const fetchLeaderboard = async () => {
    try {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate user statistics
      const userStats: { [userId: string]: LeaderboardUser } = {};

      tasks.forEach((task: any) => {
        // Initialize poster if not exists
        if (task.posterId && !userStats[task.posterId]) {
          userStats[task.posterId] = {
            userId: task.posterId,
            userName: task.posterName || 'Anonymous',
            userAvatar: task.posterAvatar,
            pointsEarned: 0,
            tasksCompleted: 0,
            tasksPosted: 0,
            pointsStacked: 0,
            tasksStacked: 0
          };
        }

        // Initialize doer if not exists
        if (task.doerId && !userStats[task.doerId]) {
          userStats[task.doerId] = {
            userId: task.doerId,
            userName: task.doerName || 'Anonymous',
            userAvatar: undefined,
            pointsEarned: 0,
            tasksCompleted: 0,
            tasksPosted: 0,
            pointsStacked: 0,
            tasksStacked: 0
          };
        }

        // Count posted tasks
        if (task.posterId && userStats[task.posterId]) {
          userStats[task.posterId].tasksPosted += 1;
        }

        // Count completed tasks and points earned
        if (task.status === 'validated' && task.doerId && userStats[task.doerId]) {
          userStats[task.doerId].tasksCompleted += 1;
          userStats[task.doerId].pointsEarned += task.bounty || 0;
        }

        // Count stacking contributions
        if (task.bountyContributors) {
          task.bountyContributors.forEach((contributor: any) => {
            if (!userStats[contributor.userId]) {
              userStats[contributor.userId] = {
                userId: contributor.userId,
                userName: contributor.userName || 'Anonymous',
                userAvatar: contributor.userAvatar,
                pointsEarned: 0,
                tasksCompleted: 0,
                tasksPosted: 0,
                pointsStacked: 0,
                tasksStacked: 0
              };
            }
            userStats[contributor.userId].pointsStacked += contributor.amount || 0;
            userStats[contributor.userId].tasksStacked += 1;
          });
        }
      });

      // Convert to array and sort by selected criteria
      const sortedUsers = Object.values(userStats)
        .map(user => ({
          ...user,
          totalContribution: user.pointsEarned + user.pointsStacked
        }))
        .sort((a, b) => {
          switch (sortBy) {
            case 'earned':
              return b.pointsEarned - a.pointsEarned;
            case 'stacked':
              return b.pointsStacked - a.pointsStacked;
            case 'total':
            default:
              return b.totalContribution - a.totalContribution;
          }
        });

      setLeaderboard(sortedUsers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-50 border-yellow-200';
      case 2: return 'bg-gray-50 border-gray-200';
      case 3: return 'bg-orange-50 border-orange-200';
      default: return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Community Leaderboard</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sort By */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 self-center mr-2">Sort by:</span>
            {([
              { key: 'total', label: '🏆 Total', icon: '🏆' },
              { key: 'earned', label: '💰 Earned', icon: '💰' },
              { key: 'stacked', label: '📚 Stacked', icon: '📚' }
            ] as const).map(sort => (
              <button
                key={sort.key}
                onClick={() => setSortBy(sort.key)}
                className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${
                  sortBy === sort.key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span>{sort.icon}</span>
                <span className="hidden sm:inline">{sort.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
          
          {/* Time Period */}
          <div className="flex gap-2">
            {(['all', 'month', 'week'] as const).map(period => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeframe === period 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.map((userStats, index) => {
          const rank = index + 1;
          const isCurrentUser = user && userStats.userId === user.uid;
          
          return (
            <div 
              key={userStats.userId} 
              className={`border rounded-lg p-4 ${getRankColor(rank)} ${
                isCurrentUser ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold w-12 text-center">
                    {getRankBadge(rank)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {userStats.userAvatar ? (
                      <img 
                        src={userStats.userAvatar} 
                        alt={userStats.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {userStats.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold">
                        {userStats.userName}
                        {isCurrentUser && <span className="text-blue-600 ml-2">(You)</span>}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {userStats.totalContribution} total contribution points
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-green-50 px-3 py-2 rounded">
                    <span className="text-green-600">💰</span>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-700">{userStats.pointsEarned}</div>
                      <div className="text-xs text-green-600">{userStats.tasksCompleted} tasks</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-orange-50 px-3 py-2 rounded">
                    <span className="text-orange-600">📚</span>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-700">{userStats.pointsStacked}</div>
                      <div className="text-xs text-orange-600">{userStats.tasksStacked} times</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-2 rounded">
                    <span className="text-blue-600">🏆</span>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-700">{userStats.totalContribution}</div>
                      <div className="text-xs text-blue-600">total</div>
                    </div>
                  </div>
                </div>
              </div>

              {userStats.tasksPosted > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    📝 Posted {userStats.tasksPosted} community need{userStats.tasksPosted > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No community members found yet. Be the first to help!
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How Rankings Work</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Earned Points:</strong> Complete validated tasks to earn points</p>
          <p>• <strong>Stacked Points:</strong> Add points to tasks you care about</p>
          <p>• <strong>Total Contribution:</strong> Earned + Stacked points determine your rank</p>
          <p>• Help your community by both completing tasks and supporting others!</p>
        </div>
      </div>
    </div>
  );
}
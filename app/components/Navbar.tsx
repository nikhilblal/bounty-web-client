'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn, logOut, db, getDocs, collection } from '../../firebase';
import { useAuth } from '../context/AuthContext';

interface UserStats {
  pointsEarned: number;
  pointsStacked: number;
  totalContribution: number;
}

export default function Navbar() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'board' | 'dashboard' | 'leaderboard'>('board');
  const [userStats, setUserStats] = useState<UserStats>({ pointsEarned: 0, pointsStacked: 0, totalContribution: 0 });

  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      let pointsEarned = 0;
      let pointsStacked = 0;

      tasks.forEach((task) => {
        const typedTask = task as {
          status?: string;
          doerId?: string;
          bounty?: number;
          bountyContributors?: Array<{
            userId: string;
            amount: number;
          }>;
        };
        // Count points earned from completed tasks
        if (typedTask.status === 'validated' && typedTask.doerId === user.uid) {
          pointsEarned += typedTask.bounty || 0;
        }

        // Count points stacked by user
        if (typedTask.bountyContributors) {
          typedTask.bountyContributors.forEach((contributor) => {
            if (contributor.userId === user.uid) {
              pointsStacked += contributor.amount || 0;
            }
          });
        }
      });

      setUserStats({
        pointsEarned,
        pointsStacked,
        totalContribution: pointsEarned + pointsStacked
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, fetchUserStats]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Bounty!</h1>
          </div>

          {/* Navigation Tabs */}
          {user && (
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('board')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'board'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bounty Board
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leaderboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Leaderboard
              </button>
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="text-sm text-gray-700 font-medium">{user.displayName}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                      <span className="text-green-600">💰</span>
                      <span className="text-green-700 font-semibold">{userStats.pointsEarned}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded">
                      <span className="text-orange-600">📚</span>
                      <span className="text-orange-700 font-semibold">{userStats.pointsStacked}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                      <span className="text-blue-600">🏆</span>
                      <span className="text-blue-700 font-semibold">{userStats.totalContribution}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 ml-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pass active tab to parent */}
      <div className="hidden">
        <input type="hidden" id="active-tab" value={activeTab} />
      </div>
    </nav>
  );
}
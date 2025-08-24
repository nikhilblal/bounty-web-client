'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import BountyBoard from './components/BountyBoard';
import CreateTaskForm from './components/CreateTaskForm';
import UserDashboard from './components/UserDashboard';
import Leaderboard from './components/Leaderboard';

export default function Home() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<'board' | 'dashboard' | 'leaderboard'>('board');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Listen for navigation changes from navbar
  useEffect(() => {
    const handleNavChange = () => {
      const activeTab = document.getElementById('active-tab')?.getAttribute('value') as 'board' | 'dashboard' | 'leaderboard';
      if (activeTab) {
        setActiveView(activeTab);
      }
    };

    // Poll for changes (simple approach)
    const interval = setInterval(handleNavChange, 100);
    return () => clearInterval(interval);
  }, []);

  const handleTaskCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-blue-600 mb-4">
              Bounty!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect neighbors to make a real difference locally. Post community needs, 
              stack bounties, and help build a stronger neighborhood together.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h2 className="text-2xl font-semibold mb-4">How it works</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Post Community Needs</h3>
                  <p className="text-sm text-gray-600">Share tasks that help neighbors, seniors, or local spaces</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Stack & Support</h3>
                  <p className="text-sm text-gray-600">Add points to tasks you care about, then claim and complete them</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Make Impact</h3>
                  <p className="text-sm text-gray-600">Help real people and strengthen your local community</p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-center text-gray-600 mb-4">
                Ready to help your neighbors?
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {activeView === 'board' ? (
        <div>
          <CreateTaskForm onTaskCreated={handleTaskCreated} />
          <BountyBoard key={refreshTrigger} />
        </div>
      ) : activeView === 'dashboard' ? (
        <UserDashboard />
      ) : (
        <Leaderboard />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { db, getDocs, collection, query, orderBy, updateDoc, doc } from '../../firebase';
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
  originalBounty?: number;
  bountyContributors?: Array<{
    userId: string;
    userName: string;
    userAvatar?: string;
    amount: number;
    timestamp: unknown;
  }>;
  status: 'open' | 'claimed' | 'completed' | 'validated';
  proofUrl?: string;
  proofImages?: string[];
  location?: string;
  category?: string;
  imageUrl?: string;
  createdAt: unknown;
}

export default function BountyBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'claimed' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedTasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (taskId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        doerId: user.uid,
        doerName: user.displayName,
        status: 'claimed'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error claiming task:', error);
    }
  };

  const markCompleted = async (taskId: string, proofUrl: string, proofImages?: string[]) => {
    if (!user) return;
    try {
      const updateData: Record<string, unknown> = {
        status: 'completed'
      };
      
      if (proofImages && proofImages.length > 0) {
        updateData.proofImages = proofImages;
      }
      
      if (proofUrl) {
        updateData.proofUrl = proofUrl;
      }

      await updateDoc(doc(db, 'tasks', taskId), updateData);
      fetchTasks();
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
  };

  const validateTask = async (taskId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        validatorId: user.uid,
        status: 'validated'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error validating task:', error);
    }
  };

  const boostBounty = async (taskId: string, boostAmount: number) => {
    if (!user || boostAmount <= 0) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newBountyContributor = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL,
        amount: boostAmount,
        timestamp: new Date()
      };

      const updatedContributors = [...(task.bountyContributors || []), newBountyContributor];
      const newTotalBounty = task.bounty + boostAmount;

      await updateDoc(doc(db, 'tasks', taskId), {
        bounty: newTotalBounty,
        bountyContributors: updatedContributors,
        originalBounty: task.originalBounty || task.bounty
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Error boosting bounty:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter === 'all' || task.status === filter;
    const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const handleTaskClick = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'claimed': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'validated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading bounties...</div>;
  }

  // Show expanded task if one is selected
  if (expandedTask) {
    const task = filteredTasks.find(t => t.id === expandedTask);
    if (!task) {
      setExpandedTask(null);
      return null;
    }
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <button
            onClick={() => setExpandedTask(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Board
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ExpandedTaskView task={task} user={user} onAction={() => fetchTasks()} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Bounty Board</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="design">Design & Creative</option>
              <option value="development">Development</option>
              <option value="writing">Writing & Content</option>
              <option value="research">Research</option>
              <option value="marketing">Marketing</option>
              <option value="data-entry">Data Entry</option>
              <option value="physical">Physical Task</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'open', 'claimed', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredTasks.map(task => (
          <div 
            key={task.id} 
            className="bg-white rounded-lg overflow-hidden shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTaskClick(task.id)}
          >
            {task.imageUrl && (
              <div className="aspect-video w-full">
                <img 
                  src={task.imageUrl} 
                  alt={task.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-3 flex flex-col flex-grow">
              {/* Header with title, category, and points */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-sm flex-shrink-0">
                      {getCategoryIcon(task.category || 'general')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{task.title}</h3>
                      {task.location && (
                        <span className="inline-block text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1">
                          📍 {task.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className="text-base font-bold text-green-600">
                    {task.bounty} pts
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Stackers info - compact */}
              {task.bountyContributors && task.bountyContributors.length > 0 && (
                <div className="text-xs text-gray-500 mb-2">
                  🔥 {task.bountyContributors.length} stacker{task.bountyContributors.length > 1 ? 's' : ''}
                </div>
              )}

              {/* Description */}
              <p className="text-gray-600 text-sm line-clamp-2 mb-2 flex-grow">{task.description}</p>
              
              {/* Author info - compact */}
              <div className="text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1">
                  {task.posterAvatar ? (
                    <img 
                      src={task.posterAvatar} 
                      alt={task.posterName}
                      className="w-3 h-3 rounded-full"
                    />
                  ) : (
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  )}
                  <span>by {task.posterName}</span>
                  {task.doerName && (
                    <span className="ml-2">• claimed by {task.doerName}</span>
                  )}
                </div>
              </div>

            {/* Proof section - compact */}
            {(task.proofUrl || (task.proofImages && task.proofImages.length > 0)) && (
              <div className="mb-2">
                {task.proofUrl && (
                  <a 
                    href={task.proofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs block mb-1"
                  >
                    📄 View proof
                  </a>
                )}
                {task.proofImages && task.proofImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-1">
                    {task.proofImages.slice(0, 3).map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Proof ${index + 1}`}
                        className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-90"
                        onClick={(e) => { e.stopPropagation(); window.open(imageUrl, '_blank'); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-auto" onClick={(e) => e.stopPropagation()}>
              {/* Stack Bounty - Only available for open tasks */}
              {task.status === 'open' && user && (
                <BountyStackButton 
                  onStack={(amount) => boostBounty(task.id, amount)} 
                />
              )}

              {task.status === 'open' && user && task.posterId !== user.uid && (
                <button
                  onClick={(e) => { e.stopPropagation(); claimTask(task.id); }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                >
                  Claim
                </button>
              )}
              
              {task.status === 'claimed' && user && task.doerId === user.uid && (
                <ProofSubmissionForm 
                  onSubmit={(proofImages, proofUrl) => markCompleted(task.id, proofUrl || '', proofImages)} 
                />
              )}

              {task.status === 'completed' && user && task.posterId === user.uid && (
                <button
                  onClick={(e) => { e.stopPropagation(); validateTask(task.id); }}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-medium"
                >
                  Validate
                </button>
              )}
            </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No {filter === 'all' ? '' : filter} tasks found.
        </div>
      )}
    </div>
  );
}

function BountyStackButton({ onStack }: { onStack: (amount: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [stackAmount, setStackAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(stackAmount);
    if (amount <= 0) return;
    
    setIsSubmitting(true);
    await onStack(amount);
    setIsSubmitting(false);
    setStackAmount('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-2 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs font-medium flex items-center gap-1"
      >
        📚 Stack
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1 items-center">
      <input
        type="number"
        value={stackAmount}
        onChange={(e) => setStackAmount(e.target.value)}
        placeholder="pts"
        min="1"
        className="w-16 px-1.5 py-1 border rounded text-xs"
        required
        autoFocus
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50"
      >
        {isSubmitting ? '...' : '+'}
      </button>
      <button
        type="button"
        onClick={() => { setIsOpen(false); setStackAmount(''); }}
        className="px-1 py-1 text-gray-500 hover:text-gray-700 text-xs"
      >
        ✕
      </button>
    </form>
  );
}

function ProofSubmissionForm({ onSubmit }: { onSubmit: (proofImages: string[], proofUrl?: string) => void }) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [proofUrl, setProofUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCamera, setUseCamera] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setSelectedImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImages.length === 0 && !proofUrl.trim()) {
      alert('Please provide proof images or a URL');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const uploadedImageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        // Import Firebase storage functions
        const { storage, ref, uploadBytes, getDownloadURL } = await import('../../firebase');
        
        for (const file of selectedImages) {
          const imageRef = ref(storage, `proof-images/${Date.now()}-${file.name}`);
          await uploadBytes(imageRef, file);
          const url = await getDownloadURL(imageRef);
          uploadedImageUrls.push(url);
        }
      }
      
      await onSubmit(uploadedImageUrls, proofUrl || undefined);
      
      // Reset form
      setSelectedImages([]);
      setImagePreviews([]);
      setProofUrl('');
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Error uploading proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => setUseCamera(true)}
          className={`px-2 py-1 rounded text-xs ${useCamera ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          📷
        </button>
        <button
          type="button"
          onClick={() => setUseCamera(false)}
          className={`px-2 py-1 rounded text-xs ${!useCamera ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          🔗
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {useCamera ? (
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleImageChange}
              className="w-full px-2 py-1.5 border rounded text-xs"
            />
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-1 mt-1">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={preview} 
                      alt={`Proof ${index + 1}`}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            placeholder="Proof URL"
            className="w-full px-2 py-1.5 border rounded text-xs"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting || (selectedImages.length === 0 && !proofUrl.trim())}
          className="w-full px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '...' : 'Complete'}
        </button>
      </form>
    </div>
  );
}

function ExpandedTaskView({ task, user, onAction }: { 
  task: Task; 
  user: ReturnType<typeof useAuth>['user']; 
  onAction: () => void;
}) {
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [isSubmittingValidate, setIsSubmittingValidate] = useState(false);

  const claimTask = async () => {
    if (!user) return;
    setIsSubmittingClaim(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        doerId: user.uid,
        doerName: user.displayName,
        status: 'claimed'
      });
      onAction();
    } catch (error) {
      console.error('Error claiming task:', error);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const validateTask = async () => {
    if (!user) return;
    setIsSubmittingValidate(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        validatorId: user.uid,
        status: 'validated'
      });
      onAction();
    } catch (error) {
      console.error('Error validating task:', error);
    } finally {
      setIsSubmittingValidate(false);
    }
  };

  const boostBounty = async (boostAmount: number) => {
    if (!user || boostAmount <= 0) return;
    
    try {
      const newBountyContributor = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL,
        amount: boostAmount,
        timestamp: new Date()
      };

      const updatedContributors = [...(task.bountyContributors || []), newBountyContributor];
      const newTotalBounty = task.bounty + boostAmount;

      await updateDoc(doc(db, 'tasks', task.id), {
        bounty: newTotalBounty,
        bountyContributors: updatedContributors,
        originalBounty: task.originalBounty || task.bounty
      });
      
      onAction();
    } catch (error) {
      console.error('Error boosting bounty:', error);
    }
  };

  const markCompleted = async (proofImages: string[], proofUrl?: string) => {
    if (!user) return;
    try {
      const updateData: Record<string, unknown> = {
        status: 'completed'
      };
      
      if (proofImages && proofImages.length > 0) {
        updateData.proofImages = proofImages;
      }
      
      if (proofUrl) {
        updateData.proofUrl = proofUrl;
      }

      await updateDoc(doc(db, 'tasks', task.id), updateData);
      onAction();
    } catch (error) {
      console.error('Error marking task as completed:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'claimed': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'validated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Image */}
      {task.imageUrl && (
        <div className="aspect-video w-full max-w-2xl mx-auto">
          <img 
            src={task.imageUrl} 
            alt={task.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">
              {getCategoryIcon(task.category || 'general')}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">{task.title}</h1>
          </div>
          
          {task.location && (
            <div className="flex items-center gap-1 text-gray-600 mb-3">
              <span>📍</span>
              <span>{task.location}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-3xl font-bold text-green-600">
            {task.bounty} pts
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="prose max-w-none">
        <h3 className="text-lg font-semibold mb-2">Description</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        {task.posterAvatar ? (
          <img 
            src={task.posterAvatar} 
            alt={task.posterName}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        )}
        <div>
          <p className="font-medium">Posted by {task.posterName}</p>
          {task.doerName && (
            <p className="text-sm text-gray-600">Claimed by {task.doerName}</p>
          )}
        </div>
      </div>

      {/* Community Stackers */}
      {task.bountyContributors && task.bountyContributors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Community Stackers ({task.bountyContributors.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {task.bountyContributors.map((contributor, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                {contributor.userAvatar ? (
                  <img 
                    src={contributor.userAvatar} 
                    alt={contributor.userName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-green-300 rounded-full"></div>
                )}
                <div>
                  <p className="font-medium text-green-800">{contributor.userName}</p>
                  <p className="text-sm text-green-600">+{contributor.amount} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proof Section */}
      {(task.proofUrl || (task.proofImages && task.proofImages.length > 0)) && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Proof of Completion</h3>
          {task.proofUrl && (
            <div className="mb-4">
              <a 
                href={task.proofUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                🔗 View proof document
              </a>
            </div>
          )}
          {task.proofImages && task.proofImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {task.proofImages.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`Proof ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {user && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          {/* Stack Bounty */}
          {task.status === 'open' && (
            <BountyStackButton onStack={boostBounty} />
          )}

          {/* Claim Task */}
          {task.status === 'open' && task.posterId !== user.uid && (
            <button
              onClick={claimTask}
              disabled={isSubmittingClaim}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isSubmittingClaim ? 'Claiming...' : 'Claim Task'}
            </button>
          )}
          
          {/* Submit Proof */}
          {task.status === 'claimed' && task.doerId === user.uid && (
            <div className="w-full max-w-md">
              <ProofSubmissionForm onSubmit={markCompleted} />
            </div>
          )}

          {/* Validate Task */}
          {task.status === 'completed' && task.posterId === user.uid && (
            <button
              onClick={validateTask}
              disabled={isSubmittingValidate}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium disabled:opacity-50"
            >
              {isSubmittingValidate ? 'Validating...' : 'Validate & Pay'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL } from '../../firebase';
import { useAuth } from '../context/AuthContext';

export default function CreateTaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bounty: '',
    location: '',
    category: 'general'
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        const imageRef = ref(storage, `task-images/${Date.now()}-${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'tasks'), {
        title: formData.title,
        description: formData.description,
        bounty: parseInt(formData.bounty),
        location: formData.location,
        category: formData.category,
        imageUrl,
        posterId: user.uid,
        posterName: user.displayName,
        posterAvatar: user.photoURL,
        status: 'open',
        createdAt: serverTimestamp()
      });

      setFormData({ title: '', description: '', bounty: '', location: '', category: 'general' });
      setSelectedImage(null);
      setImagePreview(null);
      setIsOpen(false);
      onTaskCreated?.();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500">
        Sign in to create bounties
      </div>
    );
  }

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          + Post Community Need
        </button>
      ) : (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Post Community Need</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                setFormData({ title: '', description: '', bounty: '', location: '', category: 'general' });
                setSelectedImage(null);
                setImagePreview(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What community need can neighbors help with?"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how this helps your community, what's needed, and any details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="design">Design & Creative</option>
                  <option value="development">Development</option>
                  <option value="writing">Writing & Content</option>
                  <option value="research">Research</option>
                  <option value="marketing">Marketing</option>
                  <option value="data-entry">Data Entry</option>
                  <option value="physical">Community Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your neighborhood, specific address, etc."
                />
              </div>
            </div>

            <div>
              <label htmlFor="bounty" className="block text-sm font-medium text-gray-700 mb-1">
                Bounty Points
              </label>
              <input
                type="number"
                id="bounty"
                name="bounty"
                value={formData.bounty}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="How many points to offer helpers?"
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Task Image <span className="text-gray-400">(optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="text-gray-400 mb-2">📷</div>
                      <div className="text-sm text-gray-600">
                        Click to upload an image
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Post Community Need'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setFormData({ title: '', description: '', bounty: '', location: '', category: 'general' });
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
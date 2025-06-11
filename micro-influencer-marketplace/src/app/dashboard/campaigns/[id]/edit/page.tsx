'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { Calendar, DollarSign, MapPin, Tag, ArrowLeft, Save } from 'lucide-react'

const NICHE_OPTIONS = [
  'Fashion',
  'Beauty',
  'Fitness',
  'Technology',
  'Food',
  'Travel',
  'Lifestyle',
  'Gaming',
  'Business',
  'Education'
]

export default function EditCampaign() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: 0,
    start_date: '',
    end_date: '',
    target_location: '',
    target_niche: [] as string[],
    requirements: '',
    deliverables: '',
    status: 'active' as 'active' | 'paused' | 'completed'
  })

  // Helper functions for date logic
  const isDateInPast = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    return date < today
  }

  const isDateToday = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    return date.getTime() === today.getTime()
  }

  const canEditStartDate = () => {
    if (!campaign) return true
    
    // Case 1: Campaign is active and has already started (today or in the past) - cannot edit
    if (campaign.status === 'active' && (isDateInPast(campaign.start_date) || isDateToday(campaign.start_date))) {
      return false
    }
    
    // Case 2: Campaign is scheduled for the future (start date is in the future) - can edit
    if (!isDateInPast(campaign.start_date) && !isDateToday(campaign.start_date)) {
      return true
    }
    
    // Case 3: Campaign is paused or completed - can edit regardless of dates
    if (campaign.status === 'paused' || campaign.status === 'completed') {
      return true
    }
    

    return false
  }

  const canEditEndDate = () => {
    if (!campaign) return true
    // Can always edit end date unless campaign is completed
    return campaign.status !== 'completed'
  }

  const getMinStartDate = () => {
    if (!campaign) return new Date().toISOString().split('T')[0]
    
    // If campaign hasn't started yet, can set any future date
    if (!isDateInPast(campaign.start_date) && !isDateToday(campaign.start_date)) {
      return new Date().toISOString().split('T')[0]
    }
    
    // If campaign has started or is starting today, can't change to past date
    return campaign.start_date
  }

  const getMinEndDate = () => {
    // End date should be at least the start date
    return formData.start_date || new Date().toISOString().split('T')[0]
  }

  useEffect(() => {
    if (params?.id) {
      loadCampaign()
    }
  }, [params?.id])

  const loadCampaign = async () => {
    if (!params?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Ensure dates are in YYYY-MM-DD format for proper comparison
      const formattedData = {
        ...data,
        start_date: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
        end_date: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : ''
      }


      setCampaign(formattedData)
      setFormData({
        title: formattedData.title,
        description: formattedData.description,
        budget: formattedData.budget,
        start_date: formattedData.start_date,
        end_date: formattedData.end_date,
        target_location: formattedData.target_location || '',
        target_niche: formattedData.target_niche,
        requirements: formattedData.requirements,
        deliverables: formattedData.deliverables,
        status: formattedData.status
      })
    } catch (error) {
      console.error('Error loading campaign:', error)
      toast.error('Failed to load campaign')
      router.push('/dashboard/campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!params?.id) {
      toast.error('Campaign ID is missing');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('campaigns')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (error) throw error;

      toast.success('Campaign updated successfully');
      router.push(`/dashboard/campaigns/${params.id}`);
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleNicheChange = (niche: string) => {
    setFormData(prev => ({
      ...prev,
      target_niche: prev.target_niche.includes(niche)
        ? prev.target_niche.filter(n => n !== niche)
        : [...prev.target_niche, niche]
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => params?.id && router.push(`/dashboard/campaigns/${params.id}`)}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Campaign
          </button>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Edit Campaign
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Update your campaign details and requirements
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Campaign Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
              />
            </div>

            {/* Budget and Status */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget ($)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="budget"
                    min="0"
                    step="0.01"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) }))}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'paused' | 'completed' }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                  {!canEditStartDate() && (
                    <span className="text-xs text-amber-600 ml-2">(Cannot modify - campaign already started)</span>
                  )}
                </label>

                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start_date"
                    required
                    disabled={!canEditStartDate()}
                    min={getMinStartDate()}
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className={`block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 ${
                      !canEditStartDate() ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                {/* {formData.start_date && isScheduledCampaign(formData.start_date) && (
                                <p className="mt-2 text-sm text-indigo-600 flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Campaign will be scheduled to start on {new Date(formData.start_date).toLocaleDateString()}
                                </p>
                              )} */}
                {!canEditStartDate() && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Campaign has already started and cannot be rescheduled
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End Date
                  {!canEditEndDate() && (
                    <span className="text-xs text-amber-600 ml-2">(Cannot modify - campaign completed)</span>
                  )}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end_date"
                    required
                    disabled={!canEditEndDate()}
                    min={getMinEndDate()}
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className={`block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 ${
                      !canEditEndDate() ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                {!canEditEndDate() && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Cannot modify end date of completed campaign
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="target_location" className="block text-sm font-medium text-gray-700">
                Target Location (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="target_location"
                  value={formData.target_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_location: e.target.value }))}
                  className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                  placeholder="e.g., New York, USA"
                />
              </div>
            </div>

            {/* Target Niche */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Niches
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {NICHE_OPTIONS.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => handleNicheChange(niche)}
                    className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-sm font-medium ${
                      formData.target_niche.includes(niche)
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="mr-1.5 h-4 w-4" />
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                Requirements
              </label>
              <textarea
                id="requirements"
                rows={4}
                required
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
              />
            </div>

            {/* Deliverables */}
            <div>
              <label htmlFor="deliverables" className="block text-sm font-medium text-gray-700">
                Deliverables
              </label>
              <textarea
                id="deliverables"
                rows={4}
                required
                value={formData.deliverables}
                onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => params?.id && router.push(`/dashboard/campaigns/${params.id}`)}
              className="rounded-md cursor-pointer bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md cursor-pointer bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2 inline" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
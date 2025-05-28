'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Calendar, DollarSign, MapPin, Tag } from 'lucide-react'
import { CampaignTemplate } from '@/lib/types/database'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { createCampaignNotification } from '@/lib/services/notification-service'

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

export default function NewCampaign() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [saving, setSaving] = useState(false)
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
    status: 'active' as 'scheduled' | 'active' | 'paused' | 'completed'
  })
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const { user, isLoading: userLoading } = useSupabase()

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_templates')
          .select('*')
          .eq('brand_id', user?.id as string)
        if (error) throw error
        setTemplates(data || [])
      } catch (error) {
        console.error('Error loading templates:', error)
        toast.error('Failed to load templates')
      }
    }
    loadTemplates()
  }, [user?.id])

  const determineCampaignStatus = (startDate: string) => {
    if (!startDate) return 'active'
    
    const now = new Date()
    const start = new Date(startDate)
    
    // Set time to start of day for proper comparison
    now.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    return start > now ? 'scheduled' : 'active'
  }

  const isScheduledCampaign = (startDate: string) => {
    if (!startDate) return false
    
    const now = new Date()
    const start = new Date(startDate)
    
    // Set time to start of day for proper comparison
    now.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    return start > now
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const campaignStatus = determineCampaignStatus(formData.start_date)
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...formData,
          status: campaignStatus,
          brand_id: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Notify all influencers about the new campaign
      if (campaignStatus === 'active') {
        try {
          // Get all influencers
          const { data: influencers, error: influencersError } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'influencer')

          if (influencersError) throw influencersError

          // Send notification to each influencer
          const brandName = user.user_metadata?.full_name || user.email || 'A brand'
          
          await Promise.all(
            influencers.map(influencer => 
              createCampaignNotification(
                influencer.id,
                data.title,
                brandName,
                data.id
              )
            )
          )
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError)
          // Don't fail the campaign creation if notifications fail
        }
      }

      toast.success(`Campaign ${campaignStatus === 'scheduled' ? 'scheduled' : 'created'} successfully`)
      router.push(`/dashboard/campaigns/${data.id}`)
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    } finally {
      setSaving(false)
    }
  }

  const handleNicheChange = (niche: string) => {
    setFormData(prev => ({
      ...prev,
      target_niche: prev.target_niche.includes(niche)
        ? prev.target_niche.filter(n => n !== niche)
        : [...prev.target_niche, niche]
    }))
  }

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setFormData({
      title: template.title,
      description: template.description,
      budget: template.budget,
      target_location: template.target_location || '',
      target_niche: template.target_niche,
      requirements: template.requirements || '',
      deliverables: template.deliverables || '',
      start_date: '',
      end_date: '',
      status: 'active'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Create New Campaign
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Create a new influencer marketing campaign
          </p>
        </div>

        {templates.length > 0 && (
          <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Use a Template</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h3 className="font-medium text-gray-900">{template.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                placeholder="Enter campaign title"
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
                placeholder="Describe your campaign"
              />
            </div>

            {/* Budget */}
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
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start_date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.start_date}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setFormData(prev => ({ 
                        ...prev, 
                        start_date: newStartDate,
                        status: determineCampaignStatus(newStartDate)
                      }))
                    }}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                  />
                </div>
                {formData.start_date && isScheduledCampaign(formData.start_date) && (
                  <p className="mt-2 text-sm text-indigo-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Campaign will be scheduled to start on {new Date(formData.start_date).toLocaleDateString()}
                  </p>
                )}
                {formData.start_date && !isScheduledCampaign(formData.start_date) && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Campaign will start immediately when created
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end_date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                  />
                </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Niches
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {NICHE_OPTIONS.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => handleNicheChange(niche)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                      formData.target_niche.includes(niche)
                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
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
                placeholder="List the requirements for influencers"
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
                placeholder="List the expected deliverables"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/campaigns')}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all duration-200"
            >
              {saving ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
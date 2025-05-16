'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Calendar, DollarSign, MapPin, Tag } from 'lucide-react'
import { CampaignTemplate } from '@/lib/types/database'

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
  const { user } = useUser()
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
    const now = new Date()
    const start = new Date(startDate)
    return start > now ? 'scheduled' : 'active'
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Create New Campaign
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Create a new influencer marketing campaign
        </p>
      </div>

      {templates.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Use a Template</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleTemplateSelect(template)}>
                <h3 className="font-medium">{template.title}</h3>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              {formData.start_date && new Date(formData.start_date) > new Date() && (
                <p className="mt-1 text-sm text-indigo-600">
                  Campaign will be scheduled to start on {new Date(formData.start_date).toLocaleDateString()}
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
                  className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/campaigns')}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  )
} 
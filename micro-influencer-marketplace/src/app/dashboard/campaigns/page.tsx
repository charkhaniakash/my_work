'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Calendar, DollarSign, Users, ChevronRight, X, Clock, Search, Filter } from 'lucide-react'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { Campaign } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { motion, AnimatePresence } from 'framer-motion'

const nichesOptions = [
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

export default function Campaigns() {
  const {
    loading,
    error,
    createCampaign,
    updateCampaign,
    getCampaigns,
  } = useCampaigns()

  const { user } = useSupabase();
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState<Partial<Campaign>>({
    title: '',
    description: '',
    budget: 0,
    start_date: '',
    end_date: '',
    requirements: '',
    target_niche: [],
    target_location: '',
    status: 'active' as 'active' | 'paused' | 'completed'
  })

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    const data = await getCampaigns()
    if (data) {
      setCampaigns(data)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNicheChange = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      target_niche: prev.target_niche?.includes(niche)
        ? prev.target_niche.filter((n) => n !== niche)
        : [...(prev.target_niche || []), niche]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.budget || !formData.start_date || !formData.end_date) {
        toast.error('Please fill in all required fields')
        return
      }

      // Convert requirements to array if it's a string
      const requirements = typeof formData.requirements === 'string' 
        ? [formData.requirements]
        : formData.requirements || []

      const campaign = await createCampaign({
        ...formData as Omit<Campaign, 'id' | 'created_at' | 'updated_at'>,
        budget: Number(formData.budget),
        requirements: formData.requirements || '',
        target_niche: formData.target_niche || [],
        status: 'active' as 'active' | 'paused' | 'completed'
      })

      if (campaign) {
        toast.success('Campaign created successfully')
        setCampaigns([...campaigns, campaign])
        setFormData({
          title: '',
          description: '',
          budget: 0,
          start_date: '',
          end_date: '',
          requirements: '',
          target_niche: [],
          target_location: '',
          status: 'active' as 'active' | 'paused' | 'completed'
        })
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Campaign creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign')
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 max-w-md">
          <h3 className="text-lg font-medium">Error Loading Campaigns</h3>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Campaigns
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage your influencer marketing campaigns
          </p>
        </div>
        {user?.user_metadata?.role === 'brand' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors duration-200"
          >
            <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Create Campaign
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {/* Campaign List */}
      <AnimatePresence>
        {filteredCampaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating a new campaign'}
            </p>
            {user?.user_metadata?.role === 'brand' && !searchQuery && statusFilter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Create Campaign
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <a href={`/dashboard/campaigns/${campaign.id}`} className="block">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {campaign.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {campaign.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>${campaign.budget}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <span>{campaign.target_location || 'Any location'}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {campaign.target_niche?.map((niche) => (
                          <span
                            key={niche}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {niche}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center">
                        {campaign.status === 'scheduled' ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            <Clock className="mr-1 h-4 w-4" />
                            Scheduled
                          </span>
                        ) : campaign.status === 'active' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        ) : campaign.status === 'paused' ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50"
          >
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
                >
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setShowCreateModal(false)}
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg font-semibold leading-6 text-gray-900">
                        Create New Campaign
                      </h3>
                      <div className="mt-6 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                              Campaign Title
                            </label>
                            <input
                              type="text"
                              name="title"
                              id="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                              required
                              placeholder="Enter campaign title"
                            />
                          </div>

                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              name="description"
                              id="description"
                              rows={3}
                              value={formData.description}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                              required
                              placeholder="Describe your campaign"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                                Budget
                              </label>
                              <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                  type="number"
                                  name="budget"
                                  id="budget"
                                  value={formData.budget}
                                  onChange={handleInputChange}
                                  className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3"
                                  required
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="target_location" className="block text-sm font-medium text-gray-700">
                                Target Location
                              </label>
                              <input
                                type="text"
                                name="target_location"
                                id="target_location"
                                value={formData.target_location}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                                placeholder="e.g., New York, USA"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                                Start Date
                              </label>
                              <input
                                type="date"
                                name="start_date"
                                id="start_date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                                required
                              />
                            </div>

                            <div>
                              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                                End Date
                              </label>
                              <input
                                type="date"
                                name="end_date"
                                id="end_date"
                                value={formData.end_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Target Niches
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              {nichesOptions.map((niche) => (
                                <button
                                  key={niche}
                                  type="button"
                                  onClick={() => handleNicheChange(niche)}
                                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                    formData.target_niche?.includes(niche)
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {niche}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                              Requirements
                            </label>
                            <textarea
                              name="requirements"
                              id="requirements"
                              rows={3}
                              value={formData.requirements}
                              onChange={handleInputChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3"
                              placeholder="List the requirements for influencers"
                            />
                          </div>

                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="inline-flex w-full justify-center rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 sm:ml-3 sm:w-auto"
                            >
                              Create Campaign
                            </button>
                            <button
                              type="button"
                              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors duration-200 sm:mt-0 sm:w-auto"
                              onClick={() => setShowCreateModal(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Calendar, DollarSign, Users, ChevronRight, X } from 'lucide-react'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { Campaign } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/lib/auth-context'

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
  const { user } = useAuth()
  const {
    loading,
    error,
    createCampaign,
    updateCampaign,
    getCampaigns,
  } = useCampaigns()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [formData, setFormData] = useState<Partial<Campaign>>({
    title: '',
    description: '',
    budget: 0,
    start_date: '',
    end_date: '',
    requirements: [],
    target_niche: [],
    target_location: '',
    status: 'draft'
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
    
    if (!user?.id) {
      toast.error('You must be logged in to create a campaign')
      return
    }

    console.log("createCampaign", createCampaign)

    try {
      const campaign = await createCampaign({
        ...formData as Omit<Campaign, 'id' | 'created_at' | 'updated_at'>,
        brand_id: user.id,
        budget: Number(formData.budget)
      })

      console.log("campaign", campaign)

      if (campaign) {
        toast.success('Campaign created successfully')
        setCampaigns([...campaigns, campaign])
        setFormData({
          title: '',
          description: '',
          budget: 0,
          start_date: '',
          end_date: '',
          requirements: [],
          target_niche: [],
          target_location: '',
          status: 'draft'
        })
        setShowCreateModal(false)
      }
    } catch (error) {
      toast.error('Failed to create campaign')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Campaigns
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Manage your influencer marketing campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Create Campaign
        </button>
      </div>

      {/* Campaign List */}
      <ul role="list" className="divide-y divide-gray-200">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <a href={`/dashboard/campaigns/${campaign.id}`} className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <p className="ml-2 truncate text-sm font-medium text-indigo-600">
                      {campaign.title}
                    </p>
                  </div>
                  <div className="ml-2 flex flex-shrink-0">
                    <p
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        campaign.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <DollarSign
                        className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      ${campaign.budget}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      <Calendar
                        className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      {new Date(campaign.start_date).toLocaleDateString()} -{' '}
                      {new Date(campaign.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <ChevronRight
                      className="ml-2 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Create Campaign
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Budget
                  </label>
                  <input
                    type="number"
                    name="budget"
                    id="budget"
                    required
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="target_location"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Target Location
                  </label>
                  <input
                    type="text"
                    name="target_location"
                    id="target_location"
                    placeholder="e.g. United States"
                    value={formData.target_location || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start_date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      id="start_date"
                      required
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="end_date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      id="end_date"
                      required
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Niches
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {nichesOptions.map((niche) => (
                      <label
                        key={niche}
                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm cursor-pointer ${
                          formData.target_niche?.includes(niche)
                            ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formData.target_niche?.includes(niche)}
                          onChange={() => handleNicheChange(niche)}
                        />
                        {niche}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="requirements"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    id="requirements"
                    rows={3}
                    value={formData.requirements || ''}
                    onChange={handleInputChange}
                    placeholder="Specific requirements for influencers..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Campaign
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { Campaign } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'

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

export default function EditCampaign() {
  const params = useParams()
  const router = useRouter()
  const { getCampaigns, updateCampaign } = useCampaigns()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Campaign>>({
    title: '',
    description: '',
    budget: 0,
    start_date: '',
    end_date: '',
    requirements: [],
    target_niche: [],
    target_location: '',
  })

  useEffect(() => {
    loadCampaign()
  }, [params.id])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      setError(null)

      const campaigns = await getCampaigns({ id: params.id as string })
      if (campaigns && campaigns.length > 0) {
        const campaign = campaigns[0]
        setFormData({
          title: campaign.title,
          description: campaign.description,
          budget: campaign.budget,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          requirements: campaign.requirements,
          target_niche: campaign.target_niche,
          target_location: campaign.target_location,
        })
      } else {
        setError('Campaign not found')
      }
    } catch (err) {
      setError('Failed to load campaign')
    } finally {
      setLoading(false)
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
      const campaign = await updateCampaign(params.id as string, formData)
      if (campaign) {
        toast.success('Campaign updated successfully')
        router.push(`/dashboard/campaigns/${campaign.id}`)
      }
    } catch (error) {
      toast.error('Failed to update campaign')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Edit Campaign
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6">
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
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
} 
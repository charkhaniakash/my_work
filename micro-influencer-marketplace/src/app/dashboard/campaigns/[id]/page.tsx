'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { Campaign, CampaignApplication } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import {
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  FileText,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const { getCampaigns, updateCampaign, getApplications, updateApplication } = useCampaigns()
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<CampaignApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCampaign()
  }, [params.id])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      setError(null)

      const campaigns = await getCampaigns({ id: params.id as string })
      if (campaigns && campaigns.length > 0) {
        setCampaign(campaigns[0])
        loadApplications(campaigns[0].id)
      } else {
        setError('Campaign not found')
      }
    } catch (err) {
      setError('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async (campaignId: string) => {
    const data = await getApplications({ campaignId })
    if (data) {
      setApplications(data)
    }
  }

  const handleStatusUpdate = async (newStatus: Campaign['status']) => {
    if (!campaign) return

    try {
      const updatedCampaign = await updateCampaign(campaign.id, { status: newStatus })
      if (updatedCampaign) {
        setCampaign(updatedCampaign)
        toast.success(`Campaign status updated to ${newStatus}`)
      }
    } catch (err) {
      toast.error('Failed to update campaign status')
    }
  }

  const handleApplicationUpdate = async (
    applicationId: string,
    newStatus: CampaignApplication['status']
  ) => {
    try {
      const updatedApplication = await updateApplication(applicationId, { status: newStatus })
      if (updatedApplication) {
        setApplications(apps =>
          apps.map(app =>
            app.id === applicationId ? updatedApplication : app
          )
        )
        toast.success(`Application ${newStatus}`)
      }
    } catch (err) {
      toast.error('Failed to update application')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!campaign) return <div>Campaign not found</div>

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {campaign.title}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <DollarSign className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              ${campaign.budget}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {new Date(campaign.start_date).toLocaleDateString()} -{' '}
              {new Date(campaign.end_date).toLocaleDateString()}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {campaign.target_location || 'Any location'}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Tag className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {campaign.target_niche?.join(', ') || 'All niches'}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              campaign.status === 'active'
                ? 'bg-green-100 text-green-700'
                : campaign.status === 'completed'
                ? 'bg-gray-100 text-gray-700'
                : campaign.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Description</h3>
              <p className="mt-2 text-sm text-gray-500">{campaign.description}</p>
            </div>

            {campaign.requirements && (
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Requirements</h3>
                <p className="mt-2 text-sm text-gray-500">{campaign.requirements}</p>
              </div>
            )}

            {/* Campaign Actions */}
            <div className="flex space-x-3">
              {campaign.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('active')}
                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <CheckCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Activate Campaign
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <Edit className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Edit
                  </button>
                </>
              )}
              {campaign.status === 'active' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <CheckCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Complete Campaign
                </button>
              )}
              {(campaign.status === 'draft' || campaign.status === 'active') && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                >
                  <XCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Cancel Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Applications ({applications.length})
          </h3>
          <div className="mt-4 divide-y divide-gray-200">
            {applications.map((application) => (
              <div key={application.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Proposed Rate: ${application.proposed_rate}
                    </p>
                    {application.pitch && (
                      <p className="mt-1 text-sm text-gray-500">{application.pitch}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApplicationUpdate(application.id, 'accepted')}
                          className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-100"
                        >
                          <CheckCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleApplicationUpdate(application.id, 'rejected')}
                          className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          <XCircle className="-ml-0.5 mr-1.5 h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {application.status !== 'pending' && (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          application.status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {application.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <p className="py-4 text-sm text-gray-500">No applications yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
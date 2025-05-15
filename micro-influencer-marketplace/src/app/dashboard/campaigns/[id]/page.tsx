'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign, CampaignApplication } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Tag,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

type ApplicationWithInfluencer = CampaignApplication & { influencer: { full_name: string } }

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClientComponentClient()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<ApplicationWithInfluencer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadCampaign()
      loadApplications()
    }
  }, [params.id])

  const loadCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setCampaign(data)
    } catch (error) {
      console.error('Error loading campaign:', error)
      toast.error('Failed to load campaign details')
    }
  }

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_applications')
        .select('*, influencer:users(*)')
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      setApplications(applications.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus }
          : app
      ))

      toast.success(`Application ${newStatus}`)
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Campaign not found</h3>
        <p className="mt-1 text-sm text-gray-500">The campaign you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

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
            {campaign.target_location && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                {campaign.target_location}
              </div>
            )}
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Tag className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {campaign.target_niche.join(', ')}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}
            className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit Campaign
          </button>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Campaign Details</h3>
          <div className="mt-5 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-sm text-gray-900">{campaign.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Requirements</h4>
              <p className="mt-1 text-sm text-gray-900">{campaign.requirements}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Deliverables</h4>
              <p className="mt-1 text-sm text-gray-900">{campaign.deliverables}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Applications</h3>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {applications.length} total
            </span>
          </div>
          <div className="mt-6 flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application.id} className="py-5">
                  <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          <span className="absolute inset-0" aria-hidden="true" />
                          {application.influencer.full_name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {application.pitch}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          ${application.proposed_rate}
                        </div>
                        {application.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApplicationStatus(application.id, 'accepted')}
                              className="inline-flex items-center rounded-full bg-green-100 p-1 text-green-600 hover:bg-green-200"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleApplicationStatus(application.id, 'rejected')}
                              className="inline-flex items-center rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                        {application.status === 'accepted' && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Accepted
                          </span>
                        )}
                        {application.status === 'rejected' && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            <XCircle className="mr-1 h-4 w-4" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
              {applications.length === 0 && (
                <li className="py-5 text-center text-gray-500">
                  No applications yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { Campaign, CampaignApplication, User } from '@/lib/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function CampaignApplications() {
  const params = useParams()
  const { getApplications, updateApplication } = useCampaigns()
  const [applications, setApplications] = useState<(CampaignApplication & { influencer: User })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadApplications()
  }, [params.id])

  const loadApplications = async () => {
    try {
      const { data: applications, error } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          influencer:influencer_id(*)
        `)
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(applications || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const updatedApplication = await updateApplication(applicationId, { status: newStatus })
      if (updatedApplication) {
        setApplications(apps =>
          apps.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        )
        toast.success(`Application ${newStatus}`)
      }
    } catch (error) {
      toast.error('Failed to update application status')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Campaign Applications
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Review and manage applications from influencers
        </p>
      </div>

      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        {applications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No applications yet
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li key={application.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 flex-shrink-0">
                      {application.influencer.avatar_url ? (
                        <img
                          className="h-12 w-12 rounded-full"
                          src={application.influencer.avatar_url}
                          alt={application.influencer.full_name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xl font-medium text-gray-600">
                            {application.influencer.full_name[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {application.influencer.full_name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Proposed Rate: ${application.proposed_rate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link
                      href={`/dashboard/messages?influencer=${application.influencer_id}`}
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <MessageSquare className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
                      Message
                    </Link>
                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'accepted')}
                          className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                        >
                          <CheckCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                          <XCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
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
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Pitch</h4>
                  <p className="mt-2 text-sm text-gray-500">{application.pitch}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
} 
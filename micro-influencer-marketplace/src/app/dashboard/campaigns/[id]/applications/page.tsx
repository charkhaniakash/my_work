'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCampaigns } from '@/lib/hooks/useCampaigns'
import { Campaign, User } from '@/lib/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { CheckCircle, XCircle, MessageSquare, ArrowRight, Banknote } from 'lucide-react'
import Link from 'next/link'

// Extend the types to include the approved_and_paid status
interface CampaignApplication {
  id: string;
  campaign_id: string;
  influencer_id: string;
  brand_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'approved_and_paid';
  pitch: string;
  proposed_rate: number;
  created_at: string;
  updated_at: string;
}

export default function CampaignApplications() {
  const params = useParams()
  const router = useRouter()
  const { getApplications, updateApplication } = useCampaigns()
  const [applications, setApplications] = useState<(CampaignApplication & { influencer: User })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadApplications()
  }, [params?.id])

  const loadApplications = async () => {
    try {
      // First check if we're authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log("Current session:", session)
      
      if (sessionError) {
        console.error("Session error:", sessionError)
        throw sessionError
      }

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session?.user?.id)
        .single()
      
      console.log("User role:", userData?.role)

      const { data: applications, error } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          influencer:influencer_id(*)
        `)
        .eq('campaign_id', params?.id)
        .order('created_at', { ascending: false })

      console.log("applicationsapplications", applications)
      console.log("Error if any:", error)
      
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
      const { data: updatedApplication, error } = await supabase
        .from('campaign_applications')
        .update({ status: newStatus })
        .eq('id', applicationId)
        .select()
        .single();
      
      if (error) throw error;
      
      setApplications(apps =>
        apps.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      toast.success(`Application ${newStatus}`);
      
      // If the application was accepted, redirect to the payment page
      if (newStatus === 'accepted') {
        router.push(`/dashboard/campaigns/${params?.id}/applications/${applicationId}`);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
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

      
        {applications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow">
            No applications yet
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200 bg-white rounded-lg shadow">
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
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/dashboard/messages?contact=${application.influencer_id}`}
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
                    
                    {application.status === 'accepted' && (
                      <Link
                        href={`/dashboard/campaigns/${params?.id}/applications/${application.id}`}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        <Banknote className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Make Payment
                      </Link>
                    )}
                    
                    {application.status === 'approved_and_paid' && (
                      <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                        Paid
                      </span>
                    )}
                    
                    {application.status === 'rejected' && (
                      <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-800">
                        Rejected
                      </span>
                    )}
                    
                    <Link
                      href={`/dashboard/campaigns/${params?.id}/applications/${application.id}`}
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      View Details
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Pitch</h4>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{application.pitch}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
} 
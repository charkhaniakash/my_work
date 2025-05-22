'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Banknote } from 'lucide-react';
import Link from 'next/link';
import CampaignPayment from '@/components/payments/CampaignPayment';

export default function ApplicationDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
  const [application, setApplication] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [influencer, setInfluencer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [params.id, params.applicationId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch application data
      const { data: applicationData, error: applicationError } = await supabase
        .from('campaign_applications')
        .select('*')
        .eq('id', params.applicationId)
        .single();
        
      if (applicationError) throw applicationError;
      setApplication(applicationData);
      
      // Fetch campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', applicationData.campaign_id)
        .single();
        
      if (campaignError) throw campaignError;
      setCampaign(campaignData);
      
      // Fetch influencer data
      const { data: influencerData, error: influencerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', applicationData.influencer_id)
        .single();
        
      if (influencerError) throw influencerError;
      setInfluencer(influencerData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusUpdate = async (newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('campaign_applications')
        .update({ status: newStatus })
        .eq('id', params.applicationId);
        
      if (error) throw error;
      
      setApplication({ ...application, status: newStatus });
      
      // Show payment screen if the application is accepted
      if (newStatus === 'accepted') {
        setShowPayment(true);
      } else {
        toast.success(`Application ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update application status');
    }
  };
  
  const handlePaymentSuccess = () => {
    toast.success('Payment successful! The influencer has been paid.');
    loadData(); // Reload data to get updated status
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!application || !campaign || !influencer || !user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Application not found</h3>
        <p className="mt-1 text-sm text-gray-500">The application you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/campaigns/${params.id}/applications`)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }
  
  const isBrand = user.id === campaign.brand_id;
  const canPay = isBrand && application.status === 'accepted' && !showPayment;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <button 
          onClick={() => router.push(`/dashboard/campaigns/${params.id}/applications`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Applications
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
              <p className="text-gray-600">
                For campaign: <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-indigo-600 hover:text-indigo-800">{campaign.title}</Link>
              </p>
            </div>
            <div>
              <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
                application.status === 'accepted' || application.status === 'approved_and_paid'
                  ? 'bg-green-100 text-green-700'
                  : application.status === 'rejected'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {application.status === 'approved_and_paid' 
                  ? 'Approved & Paid' 
                  : application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-b">
          <div className="flex items-start space-x-6">
            <div className="h-16 w-16 flex-shrink-0">
              {influencer.profile_image ? (
                <img
                  className="h-16 w-16 rounded-full object-cover"
                  src={influencer.profile_image}
                  alt={influencer.full_name}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600">
                    {influencer.full_name[0]}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold">{influencer.full_name}</h2>
              <p className="text-gray-600 mt-1">@{influencer.username || 'username'}</p>
              <div className="mt-4 flex items-center space-x-4">
                <Link
                  href={`/dashboard/influencers/${influencer.id}`}
                  className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100"
                >
                  View Profile
                </Link>
                <Link
                  href={`/dashboard/messages?contact=${influencer.id}`}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <MessageSquare className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
                  Message
                </Link>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                Proposed Rate: ${application.proposed_rate.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Campaign Budget: ${campaign.budget.toFixed(2)}
              </div>
              <div className="mt-6">
                {application.status === 'pending' && isBrand && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusUpdate('accepted')}
                      className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                    >
                      <CheckCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                    >
                      <XCircle className="-ml-0.5 mr-1.5 h-5 w-5" />
                      Reject
                    </button>
                  </div>
                )}
                
                {canPay && (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    <Banknote className="-ml-0.5 mr-1.5 h-5 w-5" />
                    Make Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-2">Pitch</h3>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
            {application.pitch}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="min-w-[100px] text-sm text-gray-500">
                {new Date(application.created_at).toLocaleDateString()}
              </div>
              <div>
                <p className="font-medium">Application Submitted</p>
              </div>
            </div>
            
            {application.status !== 'pending' && (
              <div className="flex items-start">
                <div className="min-w-[100px] text-sm text-gray-500">
                  {new Date(application.updated_at).toLocaleDateString()}
                </div>
                <div>
                  <p className="font-medium">Application {application.status.charAt(0).toUpperCase() + application.status.slice(1)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showPayment && (
        <div className="mt-6">
          <CampaignPayment
            campaignId={campaign.id}
            influencerId={influencer.id}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        </div>
      )}
    </div>
  );
} 
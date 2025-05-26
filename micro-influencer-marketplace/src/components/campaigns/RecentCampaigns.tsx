import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/providers/supabase-provider';
import { toast } from 'react-hot-toast';
import { FileText, Calendar, DollarSign, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  target_niche: string[];
  applications_count?: number;
}

interface RecentCampaignsProps {
  limit?: number;
}

export function RecentCampaigns({ limit = 3 }: RecentCampaignsProps) {
  const { supabase, user } = useSupabase();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get campaigns for the current brand
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          applications:campaign_applications(count)
        `)
        .eq('brand_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Process campaigns to include application count
      const processedCampaigns = data.map(campaign => ({
        ...campaign,
        applications_count: campaign.applications?.length || 0
      }));
      
      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Failed to load recent campaigns');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Recent Campaigns
        </h3>
        <p className="text-gray-500">
          You don't have any campaigns yet.
        </p>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Create your first campaign <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Campaigns
        </h3>
        <Link
          href="/dashboard/campaigns"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          View All
        </Link>
      </div>
      
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="block border border-gray-200 rounded-md p-3 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="font-medium text-indigo-600">{campaign.title}</h4>
              </div>
              <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </span>
            </div>
            
            <div className="mt-2 grid grid-cols-2 text-sm text-gray-500">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                ${campaign.budget}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {new Date(campaign.start_date).toLocaleDateString()}
              </div>
              <div className="flex items-center mt-1">
                <Users className="h-4 w-4 mr-1 text-gray-400" />
                {campaign.applications_count} applicant{campaign.applications_count === 1 ? '' : 's'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/providers/supabase-provider';
import { toast } from 'react-hot-toast';
import { DollarSign, Calendar, MapPin, Tag, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

interface MatchDetails {
  nicheScore: number;
  locationScore: number;
  audienceScore: number;
  engagementScore: number;
}

interface CampaignMatch {
  campaignId: string;
  influencerId: string;
  campaignTitle: string;
  matchScore: number;
  matchDetails: MatchDetails;
  campaign: {
    id: string;
    title: string;
    description: string;
    budget: number;
    target_niche: string[];
    target_location?: string;
    brand: {
      full_name: string;
      avatar_url?: string;
    }
  }
}

interface RecommendedCampaignsProps {
  limit?: number;
  showDetailsLink?: boolean;
}

const RecommendedCampaigns: React.FC<RecommendedCampaignsProps> = ({ 
  limit = 3, 
  showDetailsLink = true 
}) => {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendations, setRecommendations] = useState<CampaignMatch[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }
      
      // Call the matching API
      const response = await fetch(`/api/campaigns/matches?influencerId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.matches || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommended campaigns');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to render match score indicators
  const renderMatchIndicator = (score: number, label: string) => {
    const scorePercent = Math.round(score * 100);
    const getColor = () => {
      if (scorePercent >= 80) return 'bg-green-500';
      if (scorePercent >= 60) return 'bg-yellow-500';
      return 'bg-gray-300';
    };
    
    return (
      <div className="flex flex-col items-center">
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColor()}`} 
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 mt-1">{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Recommended Campaigns
        </h3>
        <p className="text-gray-500">
          No campaign matches found based on your profile. Complete your profile information to receive better recommendations.
        </p>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center mt-4 text-sm text-indigo-600 hover:text-indigo-500"
        >
          Update Your Profile <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Recommended Campaigns
        </h3>
        {showDetailsLink && (
          <Link
            href="/dashboard/discover"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View All <ArrowRight className="inline h-4 w-4 ml-1" />
          </Link>
        )}
      </div>
      
      <div className="space-y-4">
        {recommendations.slice(0, limit).map((match) => (
          <div 
            key={match.campaignId} 
            className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-indigo-600">{match.campaign.title}</h4>
              <div className="flex items-center bg-indigo-50 px-2 py-1 rounded-full">
                <Star className="h-4 w-4 text-indigo-500 mr-1" /> 
                <span className="text-sm font-medium text-indigo-700">
                  {match.matchScore}% match
                </span>
              </div>
            </div>
            
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {match.campaign.description}
            </p>
            
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex items-center text-sm text-gray-500">
                <DollarSign className="mr-1 h-4 w-4 text-gray-400" />
                ${match.campaign.budget}
              </div>
              {match.campaign.target_location && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1 h-4 w-4 text-gray-400" />
                  {match.campaign.target_location}
                </div>
              )}
            </div>
            
            <div className="mt-3 flex flex-wrap gap-1">
              {match.campaign.target_niche.map((niche) => (
                <span
                  key={niche}
                  className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {niche}
                </span>
              ))}
            </div>
            
            <div className="mt-4 grid grid-cols-4 gap-2">
              {renderMatchIndicator(match.matchDetails.nicheScore, 'Niche')}
              {renderMatchIndicator(match.matchDetails.locationScore, 'Location')}
              {renderMatchIndicator(match.matchDetails.audienceScore, 'Audience')}
              {renderMatchIndicator(match.matchDetails.engagementScore, 'Engagement')}
            </div>
            
            <div className="mt-4">
              <Link
                href={`/dashboard/available-campaigns?campaign=${match.campaignId}`}
                className="inline-block w-full text-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedCampaigns; 
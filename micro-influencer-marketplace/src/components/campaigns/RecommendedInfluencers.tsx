import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/providers/supabase-provider';
import { toast } from 'react-hot-toast';
import { Users, ArrowRight, Star, Check, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import InviteInfluencerButton from '@/components/invitations/InviteInfluencerButton';

interface MatchDetails {
  nicheScore: number;
  locationScore: number;
  audienceScore: number;
  engagementScore: number;
}

interface InfluencerMatch {
  campaignId: string;
  influencerId: string;
  matchScore: number;
  matchDetails: MatchDetails;
  influencer: {
    id: string;
    full_name: string;
    avatar_url?: string;
    profile: {
      niches: string[];
      audience_size?: number;
      engagement_rate?: number;
      followers_count?: number;
    }
  }
  alreadyInvited?: boolean;
}

interface RecommendedInfluencersProps {
  campaignId: string;
  limit?: number;
  showAllLink?: boolean;
  onInvite?: (influencerId: string) => void;
}

const RecommendedInfluencers: React.FC<RecommendedInfluencersProps> = ({
  campaignId,
  limit = 5,
  showAllLink = true,
  onInvite
}) => {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState<boolean>(true);
  const [recommendations, setRecommendations] = useState<InfluencerMatch[]>([]);
  const [showMore, setShowMore] = useState<boolean>(false);

  useEffect(() => {
    if (campaignId && user) {
      fetchRecommendations();
    }
  }, [campaignId, user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }
      
      // Call the matching API
      const response = await fetch(`/api/campaigns/matches?campaignId=${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }
      
      const data = await response.json();
      
      // Check which influencers have already been invited
      if (data.matches?.length) {
        const influencerIds = data.matches.map((match: InfluencerMatch) => match.influencerId);
        
        const { data: invitations, error: invitationsError } = await supabase
          .from('campaign_invitations')
          .select('influencer_id, status')
          .eq('campaign_id', campaignId)
          .in('influencer_id', influencerIds);
        
        if (!invitationsError && invitations) {
          // Mark influencers who already have invitations
          const matchesWithInvitationStatus = data.matches.map((match: InfluencerMatch) => {
            const invitation = invitations.find((inv: any) => inv.influencer_id === match.influencerId);
            return {
              ...match,
              alreadyInvited: !!invitation,
              invitationStatus: invitation?.status
            };
          });
          
          setRecommendations(matchesWithInvitationStatus);
        } else {
          setRecommendations(data.matches || []);
        }
      } else {
        setRecommendations(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching influencer recommendations:', error);
      toast.error('Failed to load recommended influencers');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSent = (influencerId: string) => {
    // Mark the influencer as invited
    setRecommendations(prevRecs => 
      prevRecs.map(rec => 
        rec.influencerId === influencerId 
          ? { ...rec, alreadyInvited: true, invitationStatus: 'pending' } 
          : rec
      )
    );
    
    if (onInvite) {
      onInvite(influencerId);
    }
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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
              <div key={i} className="h-16 bg-gray-100 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Recommended Influencers
        </h3>
        <p className="text-gray-500">
          No matching influencers found for this campaign. Try adjusting your campaign requirements to broaden your potential matches.
        </p>
      </div>
    );
  }

  const displayedRecommendations = showMore 
    ? recommendations 
    : recommendations.slice(0, limit);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Recommended Influencers
        </h3>
        {showAllLink && (
          <Link
            href={`/dashboard/campaigns/${campaignId}/influencers`}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            View All <ArrowRight className="inline h-4 w-4 ml-1" />
          </Link>
        )}
      </div>
      
      <div className="space-y-3">
        {displayedRecommendations.map((match) => (
          <div 
            key={match.influencerId} 
            className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 flex items-center justify-between"
          >
            <div className="flex items-start">
              <div className="h-12 w-12 flex-shrink-0">
                {match.influencer.avatar_url ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover"
                    src={match.influencer.avatar_url}
                    alt={match.influencer.full_name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-indigo-600">
                      {match.influencer.full_name[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">
                    {match.influencer.full_name}
                  </h4>
                  <div className="ml-2 flex items-center bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 text-indigo-500 mr-1" /> 
                    <span className="text-xs font-medium text-indigo-700">
                      {Math.round(match.matchScore * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mt-1">
                  {match.influencer.profile?.followers_count && (
                    <span className="mr-3">
                      {formatNumber(match.influencer.profile.followers_count)} followers
                    </span>
                  )}
                  {match.influencer.profile?.engagement_rate && (
                    <span>
                      {(match.influencer.profile.engagement_rate * 100).toFixed(1)}% engagement
                    </span>
                  )}
                </div>
                
                <div className="mt-1 flex flex-wrap gap-1">
                  {match.influencer.profile?.niches?.slice(0, 3).map((niche) => (
                    <span
                      key={niche}
                      className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800"
                    >
                      {niche}
                    </span>
                  ))}
                  {match.influencer.profile?.niches?.length > 3 && (
                    <span className="text-xs text-gray-500">+{match.influencer.profile.niches.length - 3} more</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/influencers/${match.influencerId}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Profile
                </Link>
                
                {match.alreadyInvited ? (
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-600">
                    <Check className="mr-1.5 h-4 w-4 text-green-500" />
                    Invited
                  </span>
                ) : (
                  <InviteInfluencerButton
                    campaignId={campaignId}
                    influencerId={match.influencerId}
                    onInviteSent={() => handleInviteSent(match.influencerId)}
                    buttonVariant="default"
                    buttonSize="sm"
                    buttonText="Invite"
                  />
                )}
              </div>
              
              <div className="mt-2 grid grid-cols-4 gap-1">
                {renderMatchIndicator(match.matchDetails.nicheScore, 'Niche')}
                {renderMatchIndicator(match.matchDetails.locationScore, 'Location')}
                {renderMatchIndicator(match.matchDetails.audienceScore, 'Audience')}
                {renderMatchIndicator(match.matchDetails.engagementScore, 'Engagement')}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {recommendations.length > limit && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="mt-4 w-full text-center py-2 text-sm text-indigo-600 hover:text-indigo-500 flex items-center justify-center"
        >
          {showMore ? (
            <>
              Show Less <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Show More ({recommendations.length - limit} more) <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default RecommendedInfluencers; 
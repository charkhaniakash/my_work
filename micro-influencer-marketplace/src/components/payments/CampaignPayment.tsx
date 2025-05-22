import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PaymentForm from './PaymentForm';
import { toast } from 'react-hot-toast';

interface Campaign {
  id: string;
  title: string;
  budget: number;
}

interface Influencer {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  is_verified?: boolean;
}

interface CampaignPaymentProps {
  campaignId: string;
  influencerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CampaignPayment: React.FC<CampaignPaymentProps> = ({
  campaignId,
  influencerId,
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch campaign details
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
        if (!campaignRes.ok) {
          const campaignError = await campaignRes.json();
          throw new Error(campaignError.message || 'Failed to fetch campaign details');
        }
        const campaignData = await campaignRes.json();
        setCampaign(campaignData);

        // Fetch influencer details
        console.log(`Fetching influencer data for ID: ${influencerId}`);
        const influencerRes = await fetch(`/api/users/${influencerId}`);
        
        if (!influencerRes.ok) {
          const influencerError = await influencerRes.json();
          console.error('Error fetching influencer:', influencerError);
          throw new Error(influencerError.message || 'Failed to fetch influencer details');
        }
        
        const influencerData = await influencerRes.json();
        console.log('Influencer data received:', influencerData);
        
        // Handle case where data structure might vary
        const processedInfluencerData = {
          id: influencerData.id,
          // Use full_name if available, otherwise fallback to email or a default
          full_name: influencerData.full_name || influencerData.email || 'Influencer'
        };
        
        setInfluencer(processedInfluencerData);
        setError(null);
      } catch (err: any) {
        console.error('Payment data fetch error:', err);
        setError(err.message || 'Failed to load data');
        toast.error(err.message || 'Failed to load payment information');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId && influencerId) {
      fetchData();
    } else {
      setError('Missing campaign or influencer information');
      setLoading(false);
    }
  }, [campaignId, influencerId]);

  const handlePaymentSuccess = () => {
    // Update application status to 'approved_and_paid'
    fetch(`/api/campaigns/${campaignId}/applications/${influencerId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved_and_paid' }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update application status');
        return res.json();
      })
      .then(() => {
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        console.error('Error updating application status:', err);
      });
  };

  if (loading) {
    return <div className="text-center py-8">Loading payment details...</div>;
  }

  if (error || !campaign || !influencer || !user) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
        {error || 'Failed to load payment information. Please try again later.'}
      </div>
    );
  }

  const amount = useCustomAmount && customAmount !== '' ? Number(customAmount) : campaign.budget;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Payment for Campaign</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <div className="mb-2">
          <span className="font-semibold">Campaign:</span> {campaign.title}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Influencer:</span> {influencer.full_name}
        </div>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="useCustomAmount"
              checked={useCustomAmount}
              onChange={(e) => setUseCustomAmount(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useCustomAmount">Use custom amount</label>
          </div>
          
          {useCustomAmount ? (
            <div>
              <label htmlFor="customAmount" className="block mb-1 text-sm">
                Custom amount:
              </label>
              <input
                type="number"
                id="customAmount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min={1}
                step={0.01}
                className="border rounded-md px-3 py-2 w-full"
                placeholder="Enter custom amount"
              />
            </div>
          ) : (
            <div>
              <span className="font-semibold">Amount:</span>{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(campaign.budget)}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <PaymentForm
          campaignId={campaignId}
          brandId={user.id}
          influencerId={influencerId}
          amount={amount}
          onSuccess={handlePaymentSuccess}
        />
      </div>

      <div className="flex justify-end">
        <button
          className="text-gray-600 hover:text-gray-800"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CampaignPayment; 
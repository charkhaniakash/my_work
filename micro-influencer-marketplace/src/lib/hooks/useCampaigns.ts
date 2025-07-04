import { useCallback, useState } from 'react'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { Campaign, CampaignApplication } from '@/lib/types/database'
import { useUser } from '@clerk/nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const useCampaigns = () => {
  const supabase = createClientComponentClient()
  const { user, isLoading: userLoading } = useSupabase()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCampaign = useCallback(
    async (campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        setLoading(true)
        setError(null)

        if (!user?.id) {
          throw new Error('User not authenticated')
        }

        // First check if the user exists and is a brand
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (userError) throw userError
        if (!userData || userData.role !== 'brand') {
          throw new Error('Only brands can create campaigns')
        }


        // const { data, error } = await supabase
        // .from('campaigns')
        // .insert([{
        //   ...campaignData,
        //   brand_id: user.id.toString() // Ensure this is a string to match auth.uid()::TEXT
        // }])
        // .select()
        // .single()

        // ONLY FOR TESTING - Hardcode the ID that worked manually
        const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          ...campaignData,
          brand_id: user.id // Use the authenticated user's id
        }])
        .select()
        .single();

        


        if (error) {
          console.error('Campaign creation error:', error)
          throw error
        }
        return data
      } catch (err) {
        console.error('Campaign creation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to create campaign')
        return null
      } finally {
        setLoading(false)
      }
    },
    [user, supabase]
  )

  

  const updateCampaign = useCallback(
    async (
      campaignId: string,
      updates: Partial<Omit<Campaign, 'id' | 'brand_id'>>
    ) => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('campaigns')
          .update(updates)
          .eq('id', campaignId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update campaign')
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const getCampaigns = useCallback(
    async (filters?: {
      status?: Campaign['status']
      brandId?: string
      targetNiche?: string[]
    }) => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase.from('campaigns').select('*')

        if (filters?.status) {
          query = query.eq('status', filters.status)
        }
        if (filters?.brandId) {
          query = query.eq('brand_id', filters.brandId)
        }
        if (filters?.targetNiche) {
          query = query.contains('target_niche', filters.targetNiche)
        }

        const { data, error } = await query

        if (error) throw error
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const applyCampaign = useCallback(
    async (application: Omit<CampaignApplication, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('campaign_applications')
          .insert(application)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to apply for campaign')
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const updateApplication = useCallback(
    async (
      applicationId: string,
      updates: Partial<Omit<CampaignApplication, 'id' | 'campaign_id' | 'influencer_id'>>
    ) => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('campaign_applications')
          .update(updates)
          .eq('id', applicationId)
          .select()
          .single()

        if (error) throw error
        return data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update application')
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const getApplications = useCallback(
    async (filters?: {
      campaignId?: string
      influencerId?: string
      status?: CampaignApplication['status']
    }) => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase.from('campaign_applications').select('*')

        if (filters?.campaignId) {
          query = query.eq('campaign_id', filters.campaignId)
        }
        if (filters?.influencerId) {
          query = query.eq('influencer_id', filters.influencerId)
        }
        if (filters?.status) {
          query = query.eq('status', filters.status)
        }

        const { data, error } = await query

        if (error) throw error
        return data
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch applications'
        )
        return null
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  return {
    loading,
    error,
    createCampaign,
    updateCampaign,
    getCampaigns,
    applyCampaign,
    updateApplication,
    getApplications,
  }
} 
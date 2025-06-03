'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User as BaseUser, BrandProfile } from '@/lib/types/database'
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  Music,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  BarChart2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useSupabase } from '@/lib/providers/supabase-provider'

interface User extends BaseUser {
  brand_profile?: BrandProfile | null
}

interface SocialMediaLink {
  id: string
  platform: string
  url: string
  username: string
  followers_count: number
  engagement_rate: number
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  media_url: string
  media_type: string
  campaign_id: string | null
}

interface Analytics {
  total_followers: number
  total_engagement: number
  total_reach: number
  total_impressions: number
  average_engagement_rate: number
}

export default function Profile() {
  const { user, isLoading: userLoading } = useSupabase()
  const [profile, setProfile] = useState<User | null>(null)
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([])
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userLoading && user) {
      loadProfile()
    }
  }, [userLoading, user])

  const loadProfile = async () => {
    if (!user) return
    try {
      console.log('Loading profile for user:', user.id)
      
      // Load user profile with brand profile data if user is a brand
      let profileData
      if (user.user_metadata?.role === 'brand') {
        // Load user data and most recent brand profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError) throw userError

        const { data: brandData, error: brandError } = await supabase
          .from('brand_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (brandError && brandError.code !== 'PGRST116') throw brandError

        profileData = {
          ...userData,
          brand_profile: brandData || null
        }
      } else {
        // For influencers, just load user data
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        profileData = data
      }

      console.log('Loaded profile data:', profileData)
      setProfile(profileData)

      // Load social media links
      const { data: socialData, error: socialError } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('user_id', user.id)

      if (socialError) throw socialError
      setSocialLinks(socialData || [])

      // Load portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (portfolioError) throw portfolioError
      setPortfolioItems(portfolioData || [])

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('influencer_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (analyticsError && analyticsError.code !== 'PGRST116') throw analyticsError
      setAnalytics(analyticsData)

    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const addSocialLink = async (platform: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('social_media_links')
        .insert({
          user_id: user.id,
          platform,
          url: '',
          username: ''
        })

      if (error) throw error
      loadProfile()
      toast.success('Social media link added')
    } catch (error) {
      console.error('Error adding social link:', error)
      toast.error('Failed to add social media link')
    }
  }

  const updateSocialLink = async (id: string, updates: Partial<SocialMediaLink>) => {
    try {
      const { error } = await supabase
        .from('social_media_links')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      loadProfile()
      toast.success('Social media link updated')
    } catch (error) {
      console.error('Error updating social link:', error)
      toast.error('Failed to update social media link')
    }
  }

  const deleteSocialLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_media_links')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadProfile()
      toast.success('Social media link removed')
    } catch (error) {
      console.error('Error deleting social link:', error)
      toast.error('Failed to remove social media link')
    }
  }

  console.log('Profileprofile:', profile)
  const addPortfolioItem = async () => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: user.id,
          title: 'New Portfolio Item',
          description: '',
          media_url: '',
          media_type: 'image'
        })

      if (error) throw error
      loadProfile()
      toast.success('Portfolio item added')
    } catch (error) {
      console.error('Error adding portfolio item:', error)
      toast.error('Failed to add portfolio item')
    }
  }

  const updatePortfolioItem = async (id: string, updates: Partial<PortfolioItem>) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      loadProfile()
      toast.success('Portfolio item updated')
    } catch (error) {
      console.error('Error updating portfolio item:', error)
      toast.error('Failed to update portfolio item')
    }
  }

  const deletePortfolioItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadProfile()
      toast.success('Portfolio item removed')
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      toast.error('Failed to remove portfolio item')
    }
  }

  if (userLoading || loading || !user) {
    return <div>Loading...</div>
  }

  const brandProfile = profile?.brand_profile
  const isBrand = user.user_metadata?.role === 'brand'

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {isBrand ? 'Brand Profile' : 'Influencer Profile'}
            </h2>
          </div>
          {/* <a
            href="/dashboard/settings"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Edit2 className="-ml-0.5 mr-1.5 h-5 w-5" />
            Edit Profile
          </a> */}
        </div>
      </div>

      {/* Profile Header */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-3xl font-medium text-gray-600">
                    {profile?.full_name?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {profile?.full_name}
              </h3>
              <p className="text-sm text-gray-500">
                {profile?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brand-specific Information */}
      {isBrand && brandProfile && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{brandProfile.company_size || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{brandProfile.location || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {brandProfile.website ? (
                    <a href={brandProfile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                      {brandProfile.website}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Budget Range</dt>
                <dd className="mt-1 text-sm text-gray-900">{brandProfile.budget_range || 'Not specified'}</dd>
              </div>
              {brandProfile.description && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{brandProfile.description}</dd>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rest of the profile sections */}
      {user?.user_metadata?.role === 'influencer' && (
        <>
          {/* Social Media Links */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Social Media Links</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addSocialLink('instagram')}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Add Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => addSocialLink('twitter')}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Add Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => addSocialLink('youtube')}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Add YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => addSocialLink('facebook')}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Add Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => addSocialLink('tiktok')}
                    className="p-2 text-gray-400 hover:text-gray-500"
                    title="Add TikTok"
                  >
                    <Music className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {socialLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {link.platform === 'instagram' && <Instagram className="h-6 w-6 text-pink-600" />}
                      {link.platform === 'twitter' && <Twitter className="h-6 w-6 text-blue-400" />}
                      {link.platform === 'youtube' && <Youtube className="h-6 w-6 text-red-600" />}
                      {link.platform === 'facebook' && <Facebook className="h-6 w-6 text-blue-600" />}
                      {link.platform === 'tiktok' && <Music className="h-6 w-6 text-gray-900" />}
                      <div>
                        <input
                          type="text"
                          value={link.username}
                          onChange={e => setSocialLinks(links => links.map(l => l.id === link.id ? { ...l, username: e.target.value } : l))}
                          onBlur={() => updateSocialLink(link.id, { username: link.username })}
                          placeholder="Username"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={e => setSocialLinks(links => links.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))}
                          onBlur={() => updateSocialLink(link.id, { url: link.url })}
                          placeholder="URL"
                          className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSocialLink(link.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Portfolio</h3>
                <button
                  onClick={addPortfolioItem}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
                      {item.media_type === 'image' ? (
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <video
                          src={item.media_url}
                          className="object-cover w-full h-full"
                          controls
                        />
                      )}
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={e => setPortfolioItems(items => items.map(i => i.id === item.id ? { ...i, title: e.target.value } : i))}
                        onBlur={() => updatePortfolioItem(item.id, { title: item.title })}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      <textarea
                        value={item.description}
                        onChange={e => setPortfolioItems(items => items.map(i => i.id === item.id ? { ...i, description: e.target.value } : i))}
                        onBlur={() => updatePortfolioItem(item.id, { description: item.description })}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                    <button
                      onClick={() => deletePortfolioItem(item.id)}
                      className="absolute top-2 right-2 p-2 text-white bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                  <BarChart2 className="h-6 w-6 text-gray-400" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Total Followers</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {analytics.total_followers.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Total Engagement</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {analytics.total_engagement.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Total Reach</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {analytics.total_reach.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-500">Engagement Rate</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {analytics.average_engagement_rate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 
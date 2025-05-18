'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@/lib/types/database'
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
  const [completionPercentage, setCompletionPercentage] = useState(0)
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
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError
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
        .single()

      if (analyticsError && analyticsError.code !== 'PGRST116') throw analyticsError
      setAnalytics(analyticsData)

      // Calculate profile completion
      const { data: completionData, error: completionError } = await supabase
        .rpc('calculate_profile_completion', { user_id: user.id })

      if (completionError) throw completionError
      setCompletionPercentage(completionData || 0)
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                {profile?.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt={profile.full_name || ''}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile?.full_name || 'Your Name'}
                </h2>
                <p className="text-sm text-gray-500">@{profile?.username || 'username'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Profile Completion</p>
                <p className="text-2xl font-semibold text-indigo-600">{completionPercentage}%</p>
              </div>
              <button
                onClick={() => {/* TODO: Implement edit profile */}}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

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
      {user?.user_metadata?.role === 'brand' && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Brand Information</h3>
          <p className="text-gray-700">Company: {(profile as any)?.brand_profile?.company_name || 'N/A'}</p>
          <p className="text-gray-700">Website: {(profile as any)?.brand_profile?.website || 'N/A'}</p>
          <p className="text-gray-700">Industry: {(profile as any)?.brand_profile?.industry || 'N/A'}</p>
          {/* Add more brand fields as needed */}
        </div>
      )}
    </div>
  )
} 
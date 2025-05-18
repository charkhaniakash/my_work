'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@/lib/types/database'
import { Instagram, Twitter, Youtube, Facebook, Music, Image as ImageIcon } from 'lucide-react'

export default function PublicProfile() {
  const params = useParams()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [socialLinks, setSocialLinks] = useState<any[]>([])
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      loadProfile()
    }
  }, [params.id])

  const loadProfile = async () => {
    setLoading(true)
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single()
    setProfile(userData)

    const { data: socialData } = await supabase
      .from('social_media_links')
      .select('*')
      .eq('user_id', params.id)
    setSocialLinks(socialData || [])

    const { data: portfolioData } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
    setPortfolioItems(portfolioData || [])
    setLoading(false)
  }



  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>
  if (!profile) return <div className="text-center py-12">Profile not found</div>

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt={profile.full_name || ''}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile.full_name || 'Name'}
            </h2>
            <p className="text-sm text-gray-500">@{profile.username || 'username'}</p>
            <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      {socialLinks.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Social Media</h3>
          <div className="flex flex-wrap gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-700 hover:underline"
              >
                {link.platform === 'instagram' && <Instagram className="h-5 w-5" />}
                {link.platform === 'twitter' && <Twitter className="h-5 w-5" />}
                {link.platform === 'youtube' && <Youtube className="h-5 w-5" />}
                {link.platform === 'facebook' && <Facebook className="h-5 w-5" />}
                {link.platform === 'tiktok' && <Music className="h-5 w-5" />}
                <span>@{link.username}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio */}
      {portfolioItems.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Portfolio</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {portfolioItems.map((item) => (
              <div key={item.id} className="rounded-lg overflow-hidden bg-gray-100">
                {item.media_type === 'image' ? (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="object-cover w-full h-40"
                  />
                ) : (
                  <video
                    src={item.media_url}
                    className="object-cover w-full h-40"
                    controls
                  />
                )}
                <div className="p-2">
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
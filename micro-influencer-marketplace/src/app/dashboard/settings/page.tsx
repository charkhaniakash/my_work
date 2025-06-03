'use client'

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { User, BrandProfile, InfluencerProfile } from '@/lib/types/database'
import { Camera, Save, Bell } from 'lucide-react'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  NotificationPreferences 
} from '@/lib/services/notification-preferences-service'

type Profile = BrandProfile | InfluencerProfile

export default function Settings() {
  const { user, isLoading: userLoading } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    // Brand specific fields
    company_name: '',
    industry: '',
    company_size: '',
    location: '',
    website: '',
    description: '',
    budget_range: '',
    // Influencer specific fields
    bio: '',
    niche: '',
    audience_size: '',
    engagement_rate: '',
    preferred_categories: '',
    social_links: '',
    content_types: '',
    rate_card: ''
  })
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    campaigns: true,
    applications: true,
    messages: true,
    sound_enabled: true,
    email_notifications: false
  })
  const supabase = createClientComponentClient()


  console.log("formDataformDataformData")
  useEffect(() => {
    if (!userLoading && user) {
      loadProfile()
      loadNotificationPreferences()
    }
  }, [userLoading, user])

  const loadProfile = async () => {
    if (!user) return
    try {
      console.log('Loading profile for user:', user.id)
      
      // Load user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        console.error('Error loading user data:', userError)
        throw userError
      }

      console.log('Loaded user data:', userData)

      // Load profile data based on role
      const table = user.user_metadata?.role === 'brand' ? 'brand_profiles' : 'influencer_profiles'
      console.log('Loading from table:', table)

      const { data: profileData, error: profileError } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('No profile found, will be created on save')
        } else {
          console.error('Error loading profile data:', profileError)
          throw profileError
        }
      }

      console.log('Loaded profile data:', profileData)

      // Combine the data
      const combinedData = {
        full_name: userData?.full_name || '',
        email: userData?.email || '',
        avatar_url: userData?.avatar_url || '',
        // Brand specific fields
        company_name: profileData?.company_name || '',
        industry: profileData?.industry || '',
        company_size: profileData?.company_size || '',
        location: profileData?.location || '',
        website: profileData?.website || '',
        description: profileData?.description || '',
        budget_range: profileData?.budget_range || '',
        // Influencer specific fields
        bio: profileData?.bio || '',
        niche: profileData?.niche || '',
        audience_size: profileData?.audience_size || '',
        engagement_rate: profileData?.engagement_rate || '',
        preferred_categories: profileData?.preferred_categories || '',
        social_links: profileData?.social_links || '',
        content_types: profileData?.content_types || '',
        rate_card: profileData?.rate_card || ''
      }

      console.log('Setting form data:', combinedData)

      setProfile(profileData)
      setFormData(combinedData)

    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  // Load notification preferences
  const loadNotificationPreferences = async () => {
    if (!user) return
    try {
      const prefs = await getNotificationPreferences(user.id)
      setNotificationPrefs(prefs)
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle toggle change for notification preferences
  const handleToggleChange = (field: keyof NotificationPreferences) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setSaving(true)
      console.log('Saving profile with data:', formData)

      // Update user data
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          avatar_url: formData.avatar_url
        })
        .eq('id', user.id)

      if (userError) {
        console.error('Error updating user:', userError)
        throw userError
      }

      // Update or create profile data
      const table = user.user_metadata?.role === 'brand' ? 'brand_profiles' : 'influencer_profiles'
      const profileData = user.user_metadata?.role === 'brand'
        ? {
            user_id: user.id,
            company_name: formData.company_name,
            industry: formData.industry,
            company_size: formData.company_size,
            location: formData.location,
            website: formData.website,
            description: formData.description,
            budget_range: formData.budget_range
          }
        : {
            user_id: user.id,
            bio: formData.bio,
            niche: formData.niche,
            audience_size: formData.audience_size,
            engagement_rate: formData.engagement_rate,
            preferred_categories: formData.preferred_categories,
            social_links: formData.social_links,
            content_types: formData.content_types,
            rate_card: formData.rate_card
          }

      console.log('Saving profile data:', profileData)

      // First check if profile exists
      const { data: existingProfiles, error: profileQueryError } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (profileQueryError) {
        console.error('Error checking existing profile:', profileQueryError)
        throw profileQueryError
      }

      let savedProfile
      if (existingProfiles && existingProfiles.length > 0) {
        // Update the most recent profile
        console.log('Updating existing profile with ID:', existingProfiles[0].id)
        const { data: updateData, error: updateError } = await supabase
          .from(table)
          .update(profileData)
          .eq('id', existingProfiles[0].id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating profile:', updateError)
          throw updateError
        }
        savedProfile = updateData
        console.log('Updated profile:', updateData)
      } else {
        // Create new profile
        console.log('Creating new profile')
        const { data: insertData, error: insertError } = await supabase
          .from(table)
          .insert([profileData])
          .select()
          .single()

        if (insertError) {
          console.error('Error creating profile:', insertError)
          throw insertError
        }
        savedProfile = insertData
        console.log('Created new profile:', insertData)
      }

      // Update notification preferences
      const { success, error: prefsError } = await updateNotificationPreferences(
        user.id,
        notificationPrefs
      )

      if (prefsError) {
        console.error('Error updating notification preferences:', prefsError)
      }

      // Reload the profile to ensure we have the latest data
      await loadProfile()
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file || !user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Math.random()}.${fileExt}`

      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      // Get the public URL using the proper method
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)

      // Ensure the URL is using the correct format
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const finalUrl = publicUrl.replace('undefined', baseUrl || '')
      
      console.log('Generated public URL:', finalUrl)

      // Update the user's avatar_url in the database immediately
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: finalUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating avatar URL:', updateError)
        throw updateError
      }

      // Update the form data with the new URL
      setFormData(prev => ({ ...prev, avatar_url: finalUrl }))
      
      toast.success('Avatar uploaded and saved successfully')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(`Failed to upload avatar: ${error?.message || 'Unknown error'}`)
    }
  }

  if (userLoading || loading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Settings
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Manage your profile and preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Picture</h3>
            <div className="mt-4 flex items-center space-x-6">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl font-medium text-gray-600">
                      {formData.full_name[0]}
                    </span>
                  </div>
                )}
              </div>
              <label className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                <Camera className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
                Change Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  id="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific Information */}
        {user?.user_metadata?.role === 'brand' ? (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Brand Information</h3>
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    id="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="industry"
                    id="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                    Company Size
                  </label>
                  <input
                    type="text"
                    name="company_size"
                    id="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    id="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="budget_range" className="block text-sm font-medium text-gray-700">
                    Budget Range
                  </label>
                  <input
                    type="text"
                    name="budget_range"
                    id="budget_range"
                    value={formData.budget_range}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Company Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Influencer Information</h3>
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="niche" className="block text-sm font-medium text-gray-700">
                    Niche
                  </label>
                  <input
                    type="text"
                    name="niche"
                    id="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="audience_size" className="block text-sm font-medium text-gray-700">
                    Audience Size
                  </label>
                  <input
                    type="text"
                    name="audience_size"
                    id="audience_size"
                    value={formData.audience_size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="engagement_rate" className="block text-sm font-medium text-gray-700">
                    Engagement Rate
                  </label>
                  <input
                    type="text"
                    name="engagement_rate"
                    id="engagement_rate"
                    value={formData.engagement_rate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="preferred_categories" className="block text-sm font-medium text-gray-700">
                    Preferred Categories
                  </label>
                  <input
                    type="text"
                    name="preferred_categories"
                    id="preferred_categories"
                    value={formData.preferred_categories}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="social_links" className="block text-sm font-medium text-gray-700">
                    Social Links
                  </label>
                  <input
                    type="text"
                    name="social_links"
                    id="social_links"
                    value={formData.social_links}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="content_types" className="block text-sm font-medium text-gray-700">
                    Content Types
                  </label>
                  <input
                    type="text"
                    name="content_types"
                    id="content_types"
                    value={formData.content_types}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="rate_card" className="block text-sm font-medium text-gray-700">
                    Rate Card
                  </label>
                  <input
                    type="text"
                    name="rate_card"
                    id="rate_card"
                    value={formData.rate_card}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional section for notification preferences */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-gray-500" />
              Notification Preferences
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Control how you receive notifications
            </p>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Campaign Notifications</h4>
                  <p className="text-sm text-gray-500">Get notified about new campaigns</p>
                </div>
                <button
                  type="button"
                  className={`${
                    notificationPrefs.campaigns
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  onClick={() => handleToggleChange('campaigns')}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      notificationPrefs.campaigns
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Application Notifications</h4>
                  <p className="text-sm text-gray-500">Get notified about campaign applications</p>
                </div>
                <button
                  type="button"
                  className={`${
                    notificationPrefs.applications
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  onClick={() => handleToggleChange('applications')}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      notificationPrefs.applications
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Message Notifications</h4>
                  <p className="text-sm text-gray-500">Get notified about new messages</p>
                </div>
                <button
                  type="button"
                  className={`${
                    notificationPrefs.messages
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  onClick={() => handleToggleChange('messages')}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      notificationPrefs.messages
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Sound Notifications</h4>
                  <p className="text-sm text-gray-500">Play sound when receiving notifications</p>
                </div>
                <button
                  type="button"
                  className={`${
                    notificationPrefs.sound_enabled
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  onClick={() => handleToggleChange('sound_enabled')}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      notificationPrefs.sound_enabled
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Receive important notifications via email</p>
                </div>
                <button
                  type="button"
                  className={`${
                    notificationPrefs.email_notifications
                      ? 'bg-indigo-600'
                      : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  onClick={() => handleToggleChange('email_notifications')}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      notificationPrefs.email_notifications
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Save className="-ml-0.5 mr-1.5 h-5 w-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
} 
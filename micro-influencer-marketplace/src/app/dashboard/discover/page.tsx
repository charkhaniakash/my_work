'use client'

import React, { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Search, Filter, Users, Building2, MapPin, Tag } from 'lucide-react'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { User } from '@/lib/types/database'

export default function Discover() {
  const { user } = useSupabase();
  const [profiles, setProfiles] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    role: 'all',
    niche: 'all',
    location: ''
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadProfiles()
  }, [filters])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('users')
        .select(`
          *,
          influencer_profile:influencer_profiles(*)
        `)

        console.log("query", query)

      // Apply filters
      if (filters.role !== 'all') {
        query = query.eq('role', filters.role)
      }
      if (filters.niche !== 'all') {
        query = query.contains('influencer_profile.niche', [filters.niche])
      }
      if (filters.location) {
        query = query.ilike('influencer_profile.location', `%${filters.location}%`)
      }

      const { data, error } = await query

      console.log("data", data)
      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error loading profiles:', error)
      toast.error('Failed to load profiles')
    } finally {
      setLoading(false)
    }
  }

  const filteredProfiles = profiles
    .filter(profile => profile.id !== user?.id)
    .filter(profile =>
      profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const nichesOptions = [
    'all',
    'Fashion',
    'Beauty',
    'Fitness',
    'Technology',
    'Food',
    'Travel',
    'Lifestyle',
    'Gaming',
    'Business',
    'Education'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Discover
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Find and connect with brands and influencers
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, username, or bio"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>

        <select
          value={filters.role}
          onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
          className="rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        >
          <option value="all">All Roles</option>
          <option value="brand">Brands</option>
          <option value="influencer">Influencers</option>
        </select>

        <select
          value={filters.niche}
          onChange={(e) => setFilters(f => ({ ...f, niche: e.target.value }))}
          className="rounded-md border-0 py-2 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        >
          {nichesOptions.map((niche: string) => (
            <option key={niche} value={niche}>
              {niche.charAt(0).toUpperCase() + niche.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
          className="rounded-md border-0 py-2 pl-3 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
      </div>

      {/* Profile Grid */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <div className="flex items-center">
                  {profile.profile_image ? (
                    <img
                      src={profile.profile_image}
                      alt={profile.username || ''}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      {profile.role === 'brand' ? (
                        <Building2 className="h-6 w-6 text-gray-400" />
                      ) : (
                        <Users className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {profile.full_name || profile.username}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                  </div>
                </div>

                {profile.bio && (
                  <p className="mt-4 text-sm text-gray-500 line-clamp-3">{profile.bio}</p>
                )}

                {profile.influencer_profile?.location && (
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    {profile.influencer_profile.location}
                  </div>
                )}

                {profile.influencer_profile?.niche && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {profile.influencer_profile.niche.map((niche) => (
                        <span
                          key={niche}
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                        >
                          {niche}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <a
                    href={`/dashboard/messages?contact=${profile.id}`}
                    className="block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Message
                  </a>
                </div>
              </div>
            </div>
          ))}

          {filteredProfiles.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              No profiles found matching your criteria
            </div>
          )}
        </div>
      )}
    </div>
  )
} 
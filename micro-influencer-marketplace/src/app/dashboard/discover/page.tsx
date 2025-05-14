'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { BrandProfile, User } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import { Search, Building, Globe, Users, Briefcase, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type BrandWithProfile = User & { brand_profile: BrandProfile }

export default function Discover() {
  const [brands, setBrands] = useState<BrandWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const supabase = createClientComponentClient()

  const industries = [
    'all',
    'Fashion',
    'Beauty',
    'Technology',
    'Food & Beverage',
    'Travel',
    'Health & Wellness',
    'Entertainment',
    'E-commerce',
    'Education'
  ]

  useEffect(() => {
    loadBrands()
  }, [industryFilter])

  const loadBrands = async () => {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          brand_profile:brand_profiles(*)
        `)
        .eq('role', 'brand')

      if (industryFilter !== 'all') {
        query = query.eq('brand_profile.industry', industryFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setBrands(data as BrandWithProfile[] || [])
    } catch (error) {
      console.error('Error loading brands:', error)
      toast.error('Failed to load brands')
    } finally {
      setLoading(false)
    }
  }

  const filteredBrands = brands.filter(brand => 
    brand.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.brand_profile.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.brand_profile.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Discover Brands
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Find and connect with brands that match your niche
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands..."
            className="w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        >
          {industries.map((industry) => (
            <option key={industry} value={industry}>
              {industry === 'all' ? 'All Industries' : industry}
            </option>
          ))}
        </select>
      </div>

      {/* Brands Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 flex-shrink-0">
                  {brand.avatar_url ? (
                    <Image
                      src={brand.avatar_url}
                      alt={brand.brand_profile.company_name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Building className="h-6 w-6 text-indigo-600" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {brand.brand_profile.company_name}
                  </h3>
                  <p className="text-sm text-gray-500">{brand.brand_profile.industry}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {brand.brand_profile.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {brand.brand_profile.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {brand.brand_profile.location && (
                    <div className="flex items-center">
                      <Globe className="mr-1.5 h-4 w-4 text-gray-400" />
                      {brand.brand_profile.location}
                    </div>
                  )}
                  {brand.brand_profile.company_size && (
                    <div className="flex items-center">
                      <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                      {brand.brand_profile.company_size}
                    </div>
                  )}
                  {brand.brand_profile.budget_range && (
                    <div className="flex items-center">
                      <Briefcase className="mr-1.5 h-4 w-4 text-gray-400" />
                      {brand.brand_profile.budget_range}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/dashboard/messages?brand=${brand.id}`}
                  className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  <MessageSquare className="-ml-0.5 mr-1.5 h-5 w-5" />
                  Contact Brand
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No brands found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
} 
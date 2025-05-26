'use client'

import React, { use, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Campaign, CampaignApplication } from '@/lib/types/database'
import { toast } from 'react-hot-toast'
import {
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useSupabase } from '@/lib/providers/supabase-provider'
import { has } from 'lodash'
import { createApplicationNotification } from '@/lib/services/notification-service'
import RecommendedInfluencers from '@/components/campaigns/RecommendedInfluencers'

type ApplicationWithInfluencer = CampaignApplication & { influencer: { full_name: string } }

export default function CampaignDetail() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<ApplicationWithInfluencer[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState(campaign?.notes || '')
  const [editingNotes, setEditingNotes] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')
  const [pitch, setPitch] = useState('')
  const [proposedRate, setProposedRate] = useState('')
  const [hasApplied, setHasApplied] = useState(false)
  const { user, isLoading: userLoading } = useSupabase()

  useEffect(() => {
    console.log('User state:', { user, userLoading })
    if (params?.id) {
    loadCampaign()
      loadApplications()
    }
  }, [params?.id, user, userLoading])

  // Unified effect to load tasks, files, and notes when campaign.id is ready
  useEffect(() => {
    console.log('Loading campaign data:', { campaignId: campaign?.id, userId: user?.id })
    if (campaign?.id) {
      loadTasks();
      loadFiles();
      setNotes(campaign.notes || '');
    }
  }, [campaign?.id, user?.id]);

  useEffect(() => {
    if (!userLoading && params?.id && user?.id) {
      supabase
        .from('campaign_applications')
        .select('id')
        .eq('campaign_id', params.id)
        .eq('influencer_id', user.id)
        .then(({ data }) => {
          setHasApplied(!!(data && data.length > 0))
        })
    }
  }, [params?.id, user?.id, userLoading])
  const loadCampaign = async () => {
    try {
      console.log('Loading campaign for ID:', params?.id)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', params?.id)
        .single()

      if (error) {
        console.error('Error loading campaign:', error)
        throw error
      }
      console.log('Campaign loaded:', data)
      setCampaign(data)
    } catch (error) {
      console.error('Error loading campaign:', error)
      toast.error('Failed to load campaign details')
    }
  }

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_applications')
        .select(`
          *,
          influencer:users!campaign_applications_influencer_id_fkey(*)
        `)
        .eq('campaign_id', params?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async () => {
    console.log('Loading files for campaign:', campaign?.id)
    const { data, error } = await supabase
      .from('campaign_files')
      .select('*')
      .eq('campaign_id', campaign?.id || '')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading files:', error)
    } else {
      console.log('Files loaded:', data)
      setFiles(data || [])
    }
  }

  const loadTasks = async () => {
    console.log('Loading tasks for campaign:', campaign?.id)
    const { data, error } = await supabase
      .from('deliverable_tasks')
      .select('*')
      .eq('campaign_id', campaign?.id || '')
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Error loading tasks:', error)
    } else {
      console.log('Tasks loaded:', data)
      setTasks(data || [])
    }
  }

  const handleApplicationStatus = async (applicationId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      // Get the application details first to access the influencer ID
      const { data: applicationData, error: fetchError } = await supabase
        .from('campaign_applications')
        .select('*')
        .eq('id', applicationId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Update application status
      const { error } = await supabase
        .from('campaign_applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      // Update UI state
      setApplications(applications.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus }
          : app
      ))
      
      // Create notification for the influencer
      await createApplicationNotification(
        applicationData.influencer_id,
        campaign?.title || 'Campaign',
        newStatus,
        applicationId
      )

        toast.success(`Application ${newStatus}`)
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    }
  }

  const handleNotesSave = async () => {
    const { error } = await supabase
      .from('campaigns')
      .update({ notes })
      .eq('id', campaign?.id || '')
    if (!error) {
      toast.success('Notes updated')
      setEditingNotes(false)
    } else {
      toast.error('Failed to update notes')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    // For demo: just use a fake URL, in production use Supabase Storage or S3
    const fileUrl = URL.createObjectURL(file)
    const { error } = await supabase
      .from('campaign_files')
      .insert({
        campaign_id: campaign?.id || '',
        uploader_id: user?.id,
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size
      })
    setUploading(false)
    if (!error) {
      toast.success('File uploaded')
      loadFiles()
    } else {
      toast.error('Failed to upload file')
    }
  }

  const handleAddTask = async () => {
    if (!newTask.trim()) return
    const { error } = await supabase
      .from('deliverable_tasks')
      .insert({ campaign_id: campaign?.id || '', title: newTask })
    if (!error) {
      setNewTask('')
      loadTasks()
    } else {
      toast.error('Failed to add task')
    }
  }

  const handleToggleTask = async (task: any) => {
    const { error } = await supabase
      .from('deliverable_tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
    if (!error) loadTasks()
  }

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('deliverable_tasks')
      .delete()
      .eq('id', taskId)
    if (!error) loadTasks()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Campaign not found</h3>
        <p className="mt-1 text-sm text-gray-500">The campaign you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  // Add metrics calculation after loading applications
  const totalApplications = applications.length;
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;
  const totalProposedBudget = applications.reduce((sum, app) => sum + (app.proposed_rate || 0), 0);

  // Prepare data for application trend chart
  const applicationsByDate: Record<string, number> = {}
  applications.forEach(app => {
    const date = new Date(app.created_at).toLocaleDateString()
    applicationsByDate[date] = (applicationsByDate[date] || 0) + 1
  })
  const chartData = Object.entries(applicationsByDate).map(([date, count]) => ({ date, count }))

  const acceptanceRate = totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(1) : '0.0'
  const avgProposedRate = totalApplications > 0 ? (totalProposedBudget / totalApplications).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-xs text-gray-500">Total Applications</div>
          <div className="text-2xl font-bold text-gray-900">{totalApplications}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-xs text-gray-500">Accepted</div>
          <div className="text-2xl font-bold text-green-600">{acceptedApplications}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-xs text-gray-500">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{rejectedApplications}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-xs text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingApplications}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center col-span-2 sm:col-span-4">
          <div className="text-xs text-gray-500">Total Proposed Budget</div>
          <div className="text-2xl font-bold text-indigo-600">${totalProposedBudget.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500">Acceptance Rate</div>
          <div className="text-2xl font-bold text-indigo-600">{acceptanceRate}%</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="text-xs text-gray-500">Average Proposed Rate</div>
          <div className="text-2xl font-bold text-indigo-600">${avgProposedRate}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 mb-2">Applications Over Time</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {campaign.title}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <DollarSign className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              ${campaign.budget}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {new Date(campaign.start_date).toLocaleDateString()} -{' '}
              {new Date(campaign.end_date).toLocaleDateString()}
            </div>
            {campaign.status === 'scheduled' && (
              <div className="mt-2 flex items-center text-sm text-yellow-600">
                <Clock className="mr-1.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                Scheduled to start on {new Date(campaign.start_date).toLocaleDateString()}
              </div>
            )}
            {campaign.target_location && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <MapPin className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                {campaign.target_location}
            </div>
            )}
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Tag className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {campaign.target_niche.join(', ')}
            </div>
          </div>
        </div>
        {user?.user_metadata?.role === 'brand' && (
        <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}
              className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Edit Campaign
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('campaign_templates')
                    .insert({
                      brand_id: user?.id,
                      title: campaign.title,
                      description: campaign.description,
                      budget: campaign.budget,
                      target_location: campaign.target_location,
                      target_niche: campaign.target_niche,
                      requirements: campaign.requirements,
                      deliverables: campaign.deliverables
                    });
                  if (error) throw error;
                  toast.success('Campaign saved as template!');
                } catch (error) {
                  console.error('Error saving template:', error);
                  toast.error('Failed to save template');
                }
              }}
              className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Save as Template
            </button>
        </div>
        )}
      </div>

      {/* Campaign Details */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Campaign Details</h3>
          <div className="mt-5 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-sm text-gray-900">{campaign.description}</p>
            </div>
              <div>
              <h4 className="text-sm font-medium text-gray-500">Requirements</h4>
              <p className="mt-1 text-sm text-gray-900">{campaign.requirements}</p>
              </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Deliverables</h4>
              <p className="mt-1 text-sm text-gray-900">{campaign.deliverables}</p>
            </div>
          </div>
        </div>
      </div>

      {!userLoading && hasApplied && (
        <div className="bg-green-100 border border-green-400 text-green-800 shadow sm:rounded-lg p-6 my-6">
          <h3 className="text-lg font-semibold mb-2">You have already applied to this campaign.</h3>
        </div>
      )}

      {user?.user_metadata?.role === 'influencer' && !hasApplied && (
        <div className="bg-white shadow sm:rounded-lg p-6 my-6">
          <h3 className="text-lg font-semibold mb-2">Apply to this Campaign</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!pitch.trim() || !proposedRate) return toast.error('Please fill all fields');
              const { error } = await supabase
                .from('campaign_applications')
                .insert({
                  campaign_id: params?.id,
                  influencer_id: user.id,
                  pitch,
                  proposed_rate: Number(proposedRate),
                  status: 'pending',
                  brand_id: campaign?.brand_id
                });
              if (!error) {
                toast.success('Application submitted!');
                setHasApplied(true);
              } else {
                toast.error('Failed to apply');
              }
            }}
            className="space-y-4"
          >
            <textarea
              required
              placeholder="Your pitch to the brand..."
              value={pitch}
              onChange={e => setPitch(e.target.value)}
              className="w-full border rounded p-2"
            />
            <input
              type="number"
              required
              placeholder="Proposed Rate ($)"
              value={proposedRate}
              onChange={e => setProposedRate(e.target.value)}
              className="w-full border rounded p-2"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Apply
            </button>
          </form>

        </div>
      )}

      {/* Applications */}
      {user?.user_metadata?.role === 'brand' && (
        <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Applications</h3>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {applications.length} total
              </span>
            </div>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
            {applications.map((application) => (
                  <li key={application.id} className="py-5">
                    <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Influencer avatar and name */}
                          {(application.influencer && 'profile_image' in application.influencer && (application.influencer as any).profile_image) ? (
                            <img
                              src={(application.influencer as any).profile_image}
                              alt={application.influencer.full_name || ''}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                              <Users className="h-6 w-6" />
                            </div>
                          )}
                  <div>
                            <a
                              href={`/dashboard/profile/${application.influencer_id}`}
                              className="text-sm font-semibold text-indigo-700 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {application.influencer?.full_name || 'Unknown'}
                            </a>
                            <p className="text-xs text-gray-500">@{(application.influencer as any)?.username || 'username'}</p>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            ${application.proposed_rate}
                  </div>
                    {application.status === 'pending' && (
                            <div className="flex space-x-2">
                        <button
                                onClick={() => handleApplicationStatus(application.id, 'accepted')}
                                className="inline-flex items-center rounded-full bg-green-100 p-1 text-green-600 hover:bg-green-200"
                        >
                                <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                                onClick={() => handleApplicationStatus(application.id, 'rejected')}
                                className="inline-flex items-center rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
                        >
                                <XCircle className="h-5 w-5" />
                        </button>
                            </div>
                          )}
                          {application.status === 'accepted' && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Accepted
                            </span>
                          )}
                          {application.status === 'rejected' && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              <XCircle className="mr-1 h-4 w-4" />
                              Rejected
                      </span>
                    )}
                  </div>
                </div>
                      <div className="mt-2 ml-14">
                        <p className="text-sm text-gray-800 line-clamp-2">{application.pitch}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-400 ml-14">
                        Applied {new Date(application.created_at).toLocaleDateString()}
                      </p>
              </div>
                  </li>
            ))}
            {applications.length === 0 && (
                  <li className="py-5 text-center text-gray-500">
                    No applications yet
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Internal Notes */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-gray-900">Internal Notes</div>
            {!editingNotes && (
              <button onClick={() => setEditingNotes(true)} className="text-indigo-600 text-sm">Edit</button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea
                className="w-full border rounded p-2"
                rows={4}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleNotesSave} className="bg-indigo-600 text-white px-3 py-1 rounded">Save</button>
                <button onClick={() => { setEditingNotes(false); setNotes(campaign.notes || '') }} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="text-gray-700 whitespace-pre-line min-h-[64px]">{notes || <span className="text-gray-400">No notes yet.</span>}</div>
          )}
        </div>
        {/* Shared Files */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-semibold text-gray-900">Shared Files</div>
            <label className="bg-indigo-600 text-white px-3 py-1 rounded cursor-pointer">
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              {uploading ? 'Uploading...' : 'Upload'}
            </label>
          </div>
          <ul className="divide-y divide-gray-200">
            {files.map(file => (
              <li key={file.id} className="py-2 flex items-center justify-between">
                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  {file.file_name}
                </a>
                <span className="text-xs text-gray-500">{(file.file_size / 1024).toFixed(1)} KB</span>
              </li>
            ))}
            {files.length === 0 && <li className="text-gray-400 py-2">No files uploaded yet.</li>}
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <div className="font-semibold text-gray-900 mb-2">Deliverable Checklist</div>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 border rounded px-2 py-1"
          />
          <button onClick={handleAddTask} className="bg-indigo-600 text-white px-3 py-1 rounded">Add</button>
        </div>
        <ul className="divide-y divide-gray-200">
          {tasks.map(task => (
            <li key={task.id} className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task)}
                />
                <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
              </label>
              <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 text-xs ml-2">Delete</button>
            </li>
          ))}
          {tasks.length === 0 && <li className="text-gray-400 py-2">No tasks yet.</li>}
        </ul>
      </div>

      {user?.user_metadata?.role === 'brand' && (
        <div className="mt-6">
          <RecommendedInfluencers campaignId={campaign.id} />
        </div>
      )}
    </div>
  )
} 
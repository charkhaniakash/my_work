'use client'

import { 
  Users,
  MessageSquare,
  FileText,
  TrendingUp
} from 'lucide-react'

const stats = [
  { name: 'Active Campaigns', value: '12', icon: FileText, change: '+2.5%', changeType: 'increase' },
  { name: 'Total Connections', value: '24', icon: Users, change: '+3.2%', changeType: 'increase' },
  { name: 'Messages', value: '42', icon: MessageSquare, change: '+5.4%', changeType: 'increase' },
  { name: 'Engagement Rate', value: '3.6%', icon: TrendingUp, change: '+1.2%', changeType: 'increase' },
]

export default function Dashboard() {
  // Removed auth check temporarily
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Welcome back!
        </h2>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Here's what's happening with your account today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                <li className="py-5">
                  <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                    <h3 className="text-sm font-semibold text-gray-800">
                      <span className="absolute inset-0" aria-hidden="true" />
                      New campaign invitation received
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      You have received a new campaign invitation from Brand XYZ for promoting their summer collection.
                    </p>
                  </div>
                </li>
                <li className="py-5">
                  <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                    <h3 className="text-sm font-semibold text-gray-800">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Campaign completed successfully
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      Your recent campaign with Brand ABC has been completed. The performance metrics are now available.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Quick Actions</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <FileText className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Create Campaign
              </button>
              <button className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <Users className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Find Influencers
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
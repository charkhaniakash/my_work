import React from 'react'
import { Inbox, AlertCircle, Search, Calendar, Bell, Mail, X } from 'lucide-react'

type EmptyStateIcon = 'inbox' | 'alert' | 'search' | 'calendar' | 'notification' | 'mail' | 'error'

interface EmptyStateProps {
  icon?: EmptyStateIcon
  title: string
  description: string
  className?: string
}

export default function EmptyState({ icon = 'alert', title, description, className = '' }: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'inbox':
        return <Inbox className="h-12 w-12 text-muted-foreground/60" />
      case 'search':
        return <Search className="h-12 w-12 text-muted-foreground/60" />
      case 'calendar':
        return <Calendar className="h-12 w-12 text-muted-foreground/60" />
      case 'notification':
        return <Bell className="h-12 w-12 text-muted-foreground/60" />
      case 'mail':
        return <Mail className="h-12 w-12 text-muted-foreground/60" />
      case 'error':
        return <X className="h-12 w-12 text-muted-foreground/60" />
      case 'alert':
      default:
        return <AlertCircle className="h-12 w-12 text-muted-foreground/60" />
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="bg-muted/30 p-4 rounded-full mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
    </div>
  )
} 
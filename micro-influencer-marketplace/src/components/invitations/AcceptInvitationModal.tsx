'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign } from 'lucide-react'

interface AcceptInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (pitch: string, proposedRate: number) => Promise<void>
  campaignTitle: string
  brandName: string
  isLoading?: boolean
}

export default function AcceptInvitationModal({
  isOpen,
  onClose,
  onAccept,
  campaignTitle,
  brandName,
  isLoading = false
}: AcceptInvitationModalProps) {
  const [pitch, setPitch] = useState('')
  const [proposedRate, setProposedRate] = useState('')
  const [errors, setErrors] = useState<{ pitch?: string; proposedRate?: string }>({})

  const validateForm = () => {
    const newErrors: { pitch?: string; proposedRate?: string } = {}
    
    if (!pitch.trim()) {
      newErrors.pitch = 'Please write a pitch explaining why you\'re interested in this campaign'
    } else if (pitch.trim().length < 20) {
      newErrors.pitch = 'Your pitch should be at least 20 characters long'
    }
    
    const rate = parseFloat(proposedRate)
    if (!proposedRate.trim()) {
      newErrors.proposedRate = 'Please enter your proposed rate'
    } else if (isNaN(rate) || rate <= 0) {
      newErrors.proposedRate = 'Please enter a valid rate greater than 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAccept = async () => {
    if (!validateForm()) return
    
    try {
      await onAccept(pitch.trim(), parseFloat(proposedRate))
      // Reset form on success
      setPitch('')
      setProposedRate('')
      setErrors({})
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setPitch('')
      setProposedRate('')
      setErrors({})
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Accept Campaign Invitation</DialogTitle>
          <DialogDescription>
            You're accepting an invitation from <strong>{brandName}</strong> for the campaign <strong>"{campaignTitle}"</strong>. 
            Please provide your pitch and proposed rate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pitch">Your Pitch *</Label>
            <Textarea
              id="pitch"
              placeholder="Explain why you're interested in this campaign and what you can bring to it..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={4}
              className={errors.pitch ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.pitch && (
              <p className="text-sm text-red-500">{errors.pitch}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="proposedRate">Proposed Rate (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="proposedRate"
                type="number"
                placeholder="0.00"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                className={`pl-10 ${errors.proposedRate ? 'border-red-500' : ''}`}
                min="0"
                step="0.01"
                disabled={isLoading}
              />
            </div>
            {errors.proposedRate && (
              <p className="text-sm text-red-500">{errors.proposedRate}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={isLoading}
          >
            {isLoading ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
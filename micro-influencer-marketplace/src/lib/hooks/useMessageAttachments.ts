import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { MessageAttachment } from '../types/database'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export function useMessageAttachments() {
  const [uploading, setUploading] = useState(false)
  const supabase = createClientComponentClient()

  const uploadAttachment = async (
    file: File,
    messageId: string
  ): Promise<MessageAttachment> => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('File type not supported')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit')
    }

    try {
      setUploading(true)

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const filePath = `message-attachments/${messageId}/${Date.now()}.${fileExt}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      // Create attachment record in the database
      const { data: attachment, error: dbError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: publicUrl
        })
        .select()
        .single()

      if (dbError) throw dbError

      return attachment
    } finally {
      setUploading(false)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    try {
      const { error } = await supabase
        .from('message_attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting attachment:', error)
      throw error
    }
  }

  const downloadAttachment = async (attachment: MessageAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .download(attachment.file_url)

      if (error) throw error

      // Create a download link
      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.file_name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading attachment:', error)
      throw error
    }
  }

  return {
    uploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES
  }
} 
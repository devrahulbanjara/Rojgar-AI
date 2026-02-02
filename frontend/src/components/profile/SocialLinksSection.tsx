import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Github, Linkedin, Globe, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import { profileService } from '../../services/profileService'
import { toast } from 'sonner'
import type { SocialLink } from '../../types/profile'

interface SocialLinksSectionProps {
  socialLinks: SocialLink[]
  onUpdate: () => void
}

export function SocialLinksSection({ socialLinks, onUpdate }: SocialLinksSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ type: '', url: '' })
  const [isSaving, setIsSaving] = useState(false)

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'github':
        return <Github className="w-5 h-5" />
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />
      case 'portfolio':
        return <Globe className="w-5 h-5" />
      default:
        return <Globe className="w-5 h-5" />
    }
  }

  const handleAdd = async () => {
    if (!formData.type.trim() || !formData.url.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSaving(true)
    try {
      await profileService.addSocialLink(formData)
      toast.success('Social link added successfully')
      setFormData({ type: '', url: '' })
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      toast.error('Failed to add social link')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!formData.type.trim() || !formData.url.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSaving(true)
    try {
      await profileService.updateSocialLink(id, formData)
      toast.success('Social link updated successfully')
      setEditingId(null)
      setFormData({ type: '', url: '' })
      onUpdate()
    } catch (error) {
      toast.error('Failed to update social link')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social link?')) return

    try {
      await profileService.deleteSocialLink(id)
      toast.success('Social link deleted successfully')
      onUpdate()
    } catch (error) {
      toast.error('Failed to delete social link')
      console.error(error)
    }
  }

  const startEdit = (link: SocialLink) => {
    setEditingId(link.social_link_id)
    setFormData({ type: link.type, url: link.url })
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ type: '', url: '' })
  }

  return (
    <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[#0F172A]">Social Links</h4>
            <p className="text-sm text-[#64748B]">Connect your professional profiles</p>
          </div>
        </div>
        {!isAdding && !editingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-9 px-4 border-[#D1D5DB] hover:border-[#3056F5] hover:text-[#3056F5] transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        )}
      </div>

      {/* Existing Social Links */}
      <div className="space-y-3 mb-4">
        {socialLinks.map(link => (
          <div
            key={link.social_link_id}
            className="bg-white rounded-lg p-4 border border-[#E5E7EB] hover:border-[#3056F5] transition-all duration-200"
          >
            {editingId === link.social_link_id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#374151]">Type</Label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      className="w-full h-10 pl-3 pr-10 border border-[#D1D5DB] rounded-lg focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 transition-all duration-200 select-arrow bg-white"
                    >
                      <option value="">Select type</option>
                      <option value="GitHub">GitHub</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Portfolio">Portfolio</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#374151]">URL</Label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={e => setFormData({ ...formData, url: e.target.value })}
                      className="h-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={isSaving}
                    className="h-8 px-3"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUpdate(link.social_link_id)}
                    disabled={isSaving}
                    className="h-8 px-3 bg-[#3056F5] hover:bg-[#1E40AF]"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    {getIconForType(link.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A]">{link.type}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#3056F5] hover:underline truncate block"
                    >
                      {link.url}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(link)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(link.social_link_id)}
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Social Link Form */}
      {isAdding && (
        <div className="bg-white rounded-lg p-4 border border-[#3056F5] shadow-sm">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151]">Type</Label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-10 pl-3 pr-10 border border-[#D1D5DB] rounded-lg focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 transition-all duration-200 select-arrow bg-white"
                >
                  <option value="">Select type</option>
                  <option value="GitHub">GitHub</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Portfolio">Portfolio</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151]">URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  className="h-10 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                disabled={isSaving}
                className="h-8 px-3"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={isSaving}
                className="h-8 px-3 bg-[#3056F5] hover:bg-[#1E40AF]"
              >
                <Plus className="w-4 h-4 mr-1" />
                {isSaving ? 'Adding...' : 'Add Link'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {socialLinks.length === 0 && !isAdding && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-[#64748B] mb-2">No social links added yet</p>
          <p className="text-xs text-[#94A3B8]">
            Add your professional profiles to showcase your online presence
          </p>
        </div>
      )}
    </div>
  )
}

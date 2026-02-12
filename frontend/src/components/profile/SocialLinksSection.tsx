'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Globe, Plus, Trash2, Edit2, X, Check, ExternalLink } from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
import { profileService } from '../../services/profileService'
import { toast } from 'sonner'
import type { SocialLink } from '../../types/profile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { DeleteConfirmDialog } from '../ui/delete-confirm-dialog'

interface SocialLinksSectionProps {
  socialLinks: SocialLink[]
  onUpdate: () => void
}

export function SocialLinksSection({ socialLinks, onUpdate }: SocialLinksSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ type: '', url: '' })
  const [isSaving, setIsSaving] = useState(false)

  const socialPlatforms = [
    {
      value: 'GitHub',
      label: 'GitHub',
      icon: <SiGithub className="w-4 h-4 text-social-github dark:text-white" />,
    },
    {
      value: 'LinkedIn',
      label: 'LinkedIn',
      icon: <SiLinkedin className="w-4 h-4 text-social-linkedin" />,
    },
    {
      value: 'Portfolio',
      label: 'Portfolio',
      icon: <Globe className="w-4 h-4 text-ai-500" />,
    },
  ]

  const getIconForType = (type: string, size: 'sm' | 'md' = 'sm') => {
    const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
    const iconType = type.toLowerCase()

    if (iconType.includes('linkedin')) {
      return <SiLinkedin className={`${iconSize} text-social-linkedin`} />
    }
    if (iconType.includes('github')) {
      return <SiGithub className={`${iconSize} text-social-github dark:text-white`} />
    }

    return <Globe className={`${iconSize} text-ai-500`} />
  }

  const getPlatformName = (type: string) => {
    const iconType = type.toLowerCase()
    if (iconType.includes('linkedin')) {
      return 'LinkedIn'
    }
    if (iconType.includes('github')) {
      return 'GitHub'
    }
    return 'Portfolio'
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
    <div className="bg-background-subtle rounded-xl p-6 border border-border-default">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-text-primary">Social Links</h4>
            <p className="text-sm text-text-tertiary">Connect your professional profiles</p>
          </div>
        </div>
        {!isAdding && !editingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-9 px-4 border-border-default hover:border-primary hover:text-primary transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        )}
      </div>

      {/* Existing Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {socialLinks.map(link => (
          <div
            key={link.social_link_id}
            className="bg-background-surface rounded-lg border border-border-default hover:border-primary transition-all duration-200"
          >
            {editingId === link.social_link_id ? (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-text-secondary">Type</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-10 pl-4 pr-4 py-3 border rounded-xl bg-background-surface text-left focus:outline-none text-base text-text-primary transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] border-border-default hover:border-ai-300 hover:bg-gradient-to-r hover:from-ai-50/30 hover:to-primary-50/30 hover:shadow-sm focus:border-ai-500 focus:ring-2 focus:ring-ai-500/20 flex items-center gap-3"
                          >
                            {formData.type ? (
                              <>
                                {socialPlatforms.find(p => p.value === formData.type)?.icon}
                                <span className="font-medium text-text-primary">
                                  {formData.type}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-dashed border-border-default" />
                                <span className="text-text-tertiary">Select platform...</span>
                              </>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[200px]">
                          {socialPlatforms.map(platform => (
                            <DropdownMenuItem
                              key={platform.value}
                              onClick={() => setFormData({ ...formData, type: platform.value })}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              {platform.icon}
                              <span className="font-medium">{platform.label}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-text-secondary">URL</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={formData.url}
                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                        className="h-10 border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="h-8 px-3 bg-primary hover:bg-primary-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative h-15 p-3 group">
                <div className="flex items-center gap-3 h-full">
                  <div className="flex-shrink-0">{getIconForType(link.type, 'md')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-text-primary">
                      {getPlatformName(link.type)}
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      {link.url.replace(/^https?:\/\//, '')}
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(link)}
                    className="h-6 w-6 p-0 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <DeleteConfirmDialog
                    title="Delete Social Link"
                    description="You're about to permanently delete this social link."
                    itemName={getPlatformName(link.type)}
                    onConfirm={() => handleDelete(link.social_link_id)}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-error-50 hover:text-error-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    }
                  />
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3 text-text-muted hover:text-ai-600" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Link Form */}
      {isAdding && (
        <div className="bg-background-surface rounded-lg p-4 border border-primary shadow-sm col-span-full">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-secondary">Type</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 pl-4 pr-4 py-3 border rounded-xl bg-background-surface text-left focus:outline-none text-base text-text-primary transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] border-border-default hover:border-ai-300 hover:bg-gradient-to-r hover:from-ai-50/30 hover:to-primary-50/30 hover:shadow-sm focus:border-ai-500 focus:ring-2 focus:ring-ai-500/20 flex items-center gap-3"
                    >
                      {formData.type ? (
                        <>
                          {socialPlatforms.find(p => p.value === formData.type)?.icon}
                          <span className="font-medium text-text-primary">{formData.type}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-dashed border-border-default" />
                          <span className="text-text-tertiary">Select platform...</span>
                        </>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    {socialPlatforms.map(platform => (
                      <DropdownMenuItem
                        key={platform.value}
                        onClick={() => setFormData({ ...formData, type: platform.value })}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {platform.icon}
                        <span className="font-medium">{platform.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-secondary">URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  className="h-10 border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                className="h-8 px-3 bg-primary hover:bg-primary-700"
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
          <div className="w-12 h-12 rounded-full bg-background-subtle flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6 text-text-muted" />
          </div>
          <p className="text-sm text-text-tertiary mb-2">No social links added yet</p>
          <p className="text-xs text-text-muted">
            Add your professional profiles to showcase your online presence
          </p>
        </div>
      )}
    </div>
  )
}

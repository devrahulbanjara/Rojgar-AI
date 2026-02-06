import React, { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Globe, Plus, Trash2, Edit2, X, Check, ExternalLink, ChevronDown } from 'lucide-react'
import { SiGithub, SiLinkedin } from 'react-icons/si'
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const addDropdownRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside the dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setIsAddDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const socialPlatforms = [
    {
      value: 'GitHub',
      label: 'GitHub',
      icon: <SiGithub className="w-4 h-4" style={{ color: '#24292e' }} />,
    },
    {
      value: 'LinkedIn',
      label: 'LinkedIn',
      icon: <SiLinkedin className="w-4 h-4" style={{ color: '#0A66C2' }} />,
    },
    {
      value: 'Portfolio',
      label: 'Portfolio',
      icon: <Globe className="w-4 h-4" style={{ color: '#6366F1' }} />,
    },
  ]

  const getIconForType = (type: string, size: 'sm' | 'md' = 'sm') => {
    const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
    const iconType = type.toLowerCase()

    if (iconType.includes('linkedin')) {
      return <SiLinkedin className={iconSize} style={{ color: '#0A66C2' }} />
    }
    if (iconType.includes('github')) {
      return <SiGithub className={iconSize} style={{ color: '#24292e' }} />
    }
    // Portfolio/Website
    return <Globe className={iconSize} style={{ color: '#6366F1' }} />
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
      setIsAddDropdownOpen(false)
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
      setIsDropdownOpen(false)
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
    setIsAddDropdownOpen(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    setFormData({ type: '', url: '' })
    setIsDropdownOpen(false)
    setIsAddDropdownOpen(false)
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

      {/* Existing Social Links - Premium Horizontal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {socialLinks.map(link => (
          <div
            key={link.social_link_id}
            className="bg-white rounded-lg border border-[#E5E7EB] hover:border-[#3056F5] transition-all duration-200"
          >
            {editingId === link.social_link_id ? (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#374151]">Type</Label>
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setIsDropdownOpen(!isDropdownOpen)
                            } else if (e.key === 'Escape') {
                              setIsDropdownOpen(false)
                            }
                          }}
                          className={`w-full h-10 pl-4 pr-10 py-3 border rounded-xl bg-white text-left focus:outline-none text-base text-slate-800 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] ${
                            isDropdownOpen
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                              : 'border-[#D1D5DB] hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-blue-50/30 hover:shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 h-full">
                            {formData.type ? (
                              <>
                                <div className="transition-transform duration-200 hover:scale-110">
                                  {socialPlatforms.find(p => p.value === formData.type)?.icon}
                                </div>
                                <span className="font-medium text-slate-800">{formData.type}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-300" />
                                <span className="text-slate-500">Select platform...</span>
                              </>
                            )}
                          </div>
                          <ChevronDown
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
                              isDropdownOpen
                                ? 'rotate-180 text-indigo-600'
                                : 'text-slate-400 group-hover:text-indigo-500'
                            }`}
                          />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-indigo-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 ring-1 ring-indigo-100">
                            {socialPlatforms.map((platform, index) => (
                              <button
                                key={platform.value}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, type: platform.value })
                                  setIsDropdownOpen(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 focus:bg-gradient-to-r focus:from-indigo-50 focus:to-blue-50 focus:outline-none transition-all duration-200 flex items-center gap-3 text-base text-slate-800 hover:text-indigo-700 transform hover:scale-[1.01] active:scale-[0.99] group"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div className="transition-transform duration-200 group-hover:scale-110">
                                  {platform.icon}
                                </div>
                                <span className="font-medium">{platform.label}</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
              </div>
            ) : (
              <div className="relative h-15 p-3 group">
                {/* Premium Horizontal Card Layout */}
                <div className="flex items-center gap-3 h-full">
                  {/* Icon */}
                  <div className="flex-shrink-0">{getIconForType(link.type, 'md')}</div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900">
                      {getPlatformName(link.type)}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Top Right */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(link)}
                    className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(link.social_link_id)}
                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {/* External Link Icon - Bottom Right */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3 text-gray-400 hover:text-indigo-600" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Social Link Form */}
      {isAdding && (
        <div className="bg-white rounded-lg p-4 border border-[#3056F5] shadow-sm col-span-full">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#374151]">Type</Label>
                <div className="relative" ref={addDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setIsAddDropdownOpen(!isAddDropdownOpen)
                      } else if (e.key === 'Escape') {
                        setIsAddDropdownOpen(false)
                      }
                    }}
                    className={`w-full h-10 pl-4 pr-10 py-3 border rounded-xl bg-white text-left focus:outline-none text-base text-slate-800 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] ${
                      isAddDropdownOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-[#D1D5DB] hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-blue-50/30 hover:shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 h-full">
                      {formData.type ? (
                        <>
                          <div className="transition-transform duration-200 hover:scale-110">
                            {socialPlatforms.find(p => p.value === formData.type)?.icon}
                          </div>
                          <span className="font-medium text-slate-800">{formData.type}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-300" />
                          <span className="text-slate-500">Select platform...</span>
                        </>
                      )}
                    </div>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-200 ${
                        isAddDropdownOpen
                          ? 'rotate-180 text-indigo-600'
                          : 'text-slate-400 group-hover:text-indigo-500'
                      }`}
                    />
                  </button>

                  {isAddDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-indigo-200 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-200 ring-1 ring-indigo-100">
                      {socialPlatforms.map((platform, index) => (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, type: platform.value })
                            setIsAddDropdownOpen(false)
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 focus:bg-gradient-to-r focus:from-indigo-50 focus:to-blue-50 focus:outline-none transition-all duration-200 flex items-center gap-3 text-base text-slate-800 hover:text-indigo-700 transform hover:scale-[1.01] active:scale-[0.99] group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="transition-transform duration-200 group-hover:scale-110">
                            {platform.icon}
                          </div>
                          <span className="font-medium">{platform.label}</span>
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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

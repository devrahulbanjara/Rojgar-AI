import React, { useState, useEffect } from 'react'
import { skillService } from '../../services/skillService'
import { Skill } from '../../types/skill'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Plus, Trash2, Settings, CheckCircle, AlertCircle, X } from 'lucide-react'

export function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setIsLoading(true)
      const response = await skillService.getSkills()
      setSkills(response.skills)
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to load skills. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSkill.trim()) return

    try {
      const skill = await skillService.createSkill({ skill: newSkill.trim() })
      setSkills(prev => [...prev, skill])
      setNewSkill('')
      setIsAdding(false)
      setMessage({ type: 'success', text: 'Skill added successfully!' })
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to add skill. Please try again.',
      })
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      await skillService.deleteSkill(skillId)
      setSkills(prev => prev.filter(skill => skill.id !== skillId))
      setMessage({ type: 'success', text: 'Skill deleted successfully!' })
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to delete skill. Please try again.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Skills & Expertise</h3>
        <p className="text-[#475569]">
          Manage your professional skills to help recruiters find you.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Add New Skill */}
      <div className="bg-[#F9FAFB] rounded-xl p-6 border border-[#E5E7EB] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#3056F5]" />
          <h4 className="text-lg font-semibold text-[#0F172A]">Add New Skill</h4>
        </div>

        {isAdding ? (
          <form onSubmit={handleAddSkill} className="flex items-center gap-3">
            <Input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="Enter a new skill"
              className="flex-1 h-12 px-4 border-[#D1D5DB] focus:border-[#3056F5] focus:ring-2 focus:ring-[#3056F5]/20 rounded-xl transition-all duration-200"
              autoFocus
            />
            <Button
              type="submit"
              className="px-6 h-12 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="px-6 h-12 border-[#D1D5DB] hover:bg-gray-50 rounded-xl"
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#3056F5] hover:bg-[#1E40AF] text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        )}
      </div>

      {/* Skills List */}
      <div>
        {skills.length === 0 ? (
          <div className="text-center py-12 text-[#6B7280] bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
            <Settings className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
            <p className="text-lg font-medium mb-2">No skills added yet</p>
            <p className="text-sm">Add your first skill to get started!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F3F4F6] text-[#0F172A] rounded-full border border-[#E5E7EB] hover:bg-[#E5E7EB] transition-colors duration-200"
              >
                <span className="text-sm font-medium">{skill.skill}</span>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  className="flex items-center justify-center w-5 h-5 text-[#6B7280] hover:text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
                  title="Delete skill"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {skills.length > 0 && (
        <div className="pt-6 border-t border-[#E5E7EB] mt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Are you sure you want to delete all skills?')) {
                skillService
                  .deleteAllSkills()
                  .then(() => {
                    setSkills([])
                    setMessage({ type: 'success', text: 'All skills deleted successfully!' })
                  })
                  .catch(() => {
                    setMessage({ type: 'error', text: 'Failed to delete all skills.' })
                  })
              }
            }}
            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 px-6 py-3 rounded-xl transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Skills
          </Button>
        </div>
      )}
    </div>
  )
}

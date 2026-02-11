import React, { useState, useEffect } from 'react'
import { skillService } from '../../services/skillService'
import { Skill } from '../../types/skill'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Plus, Trash2, Settings, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useDeleteConfirm } from '../ui/delete-confirm-dialog'

export function SkillsManagement() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { confirm, Dialog } = useDeleteConfirm()

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

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    await confirm({
      title: 'Delete Skill',
      description: "You're about to permanently delete the skill",
      itemName: skillName,
      onConfirm: async () => {
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
      },
    })
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
        <h3 className="text-2xl font-bold text-text-primary mb-2">Skills & Expertise</h3>
        <p className="text-text-secondary">
          Manage your professional skills to help recruiters find you.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-success-50 text-success-700 border-success-200'
              : 'bg-error-50 text-error-700 border-error-200'
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

      {}
      <div className="bg-background-subtle rounded-xl p-6 border border-border-default mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h4 className="text-lg font-semibold text-text-primary">Add New Skill</h4>
        </div>

        {isAdding ? (
          <form onSubmit={handleAddSkill} className="flex items-center gap-3">
            <Input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="Enter a new skill"
              className="flex-1 h-12 px-4 border-border-default focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all duration-200"
              autoFocus
            />
            <Button
              type="submit"
              className="px-6 h-12 bg-primary hover:bg-primary-700 text-white rounded-xl"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="px-6 h-12 border-border-default hover:bg-background-subtle rounded-xl"
            >
              Cancel
            </Button>
          </form>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </Button>
        )}
      </div>

      {}
      <div>
        {skills.length === 0 ? (
          <div className="text-center py-12 text-text-muted bg-background-subtle rounded-xl border border-border-default">
            <Settings className="w-12 h-12 mx-auto mb-4 text-text-muted" />
            <p className="text-lg font-medium mb-2">No skills added yet</p>
            <p className="text-sm">Add your first skill to get started!</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-background-subtle text-text-primary rounded-full border border-border-default hover:bg-background-muted transition-colors duration-200"
              >
                <span className="text-sm font-medium">{skill.skill}</span>
                <button
                  onClick={() => handleDeleteSkill(skill.id, skill.skill)}
                  className="flex items-center justify-center w-5 h-5 text-text-muted hover:text-error-600 hover:bg-error-100 rounded-full transition-colors duration-200"
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
        <div className="pt-6 border-t border-border-default mt-6">
          <Button
            variant="outline"
            onClick={async () => {
              await confirm({
                title: 'Delete All Skills',
                description: "You're about to permanently delete all your skills.",
                variant: 'danger',
                onConfirm: async () => {
                  try {
                    await skillService.deleteAllSkills()
                    setSkills([])
                    setMessage({ type: 'success', text: 'All skills deleted successfully!' })
                  } catch {
                    setMessage({ type: 'error', text: 'Failed to delete all skills.' })
                  }
                },
              })
            }}
            className="bg-error-50 text-error-700 border-error-200 hover:bg-error-100 hover:text-error-800 px-6 py-3 rounded-xl transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Skills
          </Button>
        </div>
      )}
      <Dialog />
    </div>
  )
}

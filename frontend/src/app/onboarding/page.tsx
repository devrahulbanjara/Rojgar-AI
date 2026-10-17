'use client'

import { useEffect, useRef, useState } from 'react'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { notify } from '@/lib/notify'
import { consumePostAuthRedirect } from '@/lib/roleRoutes'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { useCompleteOnboardingMutation } from '@/store/services/profileApi'
import { updateUser } from '@/store/slices/authSlice'
import { X } from 'lucide-react'

import AuthGuard from '@/components/common/AuthGuard'

// Available predefined roles for the candidate to select
const AVAILABLE_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Fullstack Engineer',
  'DevOps Engineer',
  'Cloud Architect',
  'Mobile Developer',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'Product Manager',
  'UI/UX Designer',
  'QA Tester',
]

function OnboardingForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const { user } = useAppSelector((s) => s.auth)
  const [completeOnboarding, { isLoading }] = useCompleteOnboardingMutation()

  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter available roles based on input
  const filteredRoles = AVAILABLE_ROLES.filter(
    (role) =>
      role.toLowerCase().includes(inputValue.toLowerCase()) && !selectedRoles.includes(role),
  )

  const handleAddRole = (role: string) => {
    const trimmed = role.trim()
    if (!trimmed) return
    if (!selectedRoles.includes(trimmed)) {
      setSelectedRoles((prev) => [...prev, trimmed])
    }
    setInputValue('')
    setIsDropdownOpen(false)
  }

  const handleRemoveRole = (role: string) => {
    setSelectedRoles((prev) => prev.filter((r) => r !== role))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        handleAddRole(inputValue)
      }
    }
  }

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedRoles.length === 0) {
      notify.error('Please select at least one role to continue.')
      return
    }

    try {
      const result = await completeOnboarding({ target_roles: selectedRoles }).unwrap()
      if (result.success && user) {
        // Update user state smoothly
        dispatch(updateUser({ ...user, is_onboarded: true }))
        notify.success('Welcome to ConvexHire!')

        // Since user roles dictate dashboards, redirect to home which then routes identically
        router.replace(consumePostAuthRedirect() ?? '/candidate')
      } else {
        notify.error(result.message || 'Something went wrong')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Failed to complete onboarding. Please try again.'
      notify.error(errorMsg)
    }
  }

  return (
    <main className="auth">
      {/* Background decorations matching the auth pages */}
      <Image
        src="/bg/bg-ui-v3.webp"
        alt=""
        width={700}
        height={700}
        className="auth__bg-top"
        aria-hidden="true"
        priority={false}
      />
      <Image
        src="/bg/bg-ui-v5.webp"
        alt=""
        width={650}
        height={650}
        className="auth__bg-bottom"
        aria-hidden="true"
        priority={false}
      />

      <div className="auth__inner">
        <header className="auth__header">
          <h1 className="auth__title">What roles are you targeting?</h1>
          <p className="auth__subtitle">
            Help us understand your career goals so we can match you with the right opportunities.
          </p>
        </header>

        <div className="auth__card" style={{ maxWidth: '600px', width: '100%' }}>
          <form className="auth__form" onSubmit={handleSubmit}>
            <div className="auth__field">
              <label className="auth__label" style={{ marginBottom: '1rem' }}>
                Search or add target roles
              </label>

              {/* Selected Pills */}
              {selectedRoles.length > 0 && (
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}
                >
                  {selectedRoles.map((role) => (
                    <div
                      key={role}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--primary-color-alpha-10)',
                        border: '1px solid var(--primary-color)',
                        borderRadius: '20px',
                        color: 'var(--primary-color)',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role)}
                        className="btn btn--secondary btn--sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input wrapper */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <input
                  type="text"
                  value={inputValue}
                  maxLength={200}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Frontend Engineer"
                  className="auth__input"
                  style={{ width: '100%' }}
                />

                {/* Dropdown */}
                {isDropdownOpen && (inputValue.length > 0 || filteredRoles.length > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#fff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                    }}
                  >
                    {filteredRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleAddRole(role)}
                        className="btn btn--secondary btn--sm"
                      >
                        {role}
                      </button>
                    ))}

                    {/* Add custom role option if typed value is not empty and not an exact match */}
                    {inputValue.trim() &&
                      !filteredRoles.some(
                        (r) => r.toLowerCase() === inputValue.trim().toLowerCase(),
                      ) && (
                        <button
                          type="button"
                          onClick={() => handleAddRole(inputValue)}
                          className="btn btn--secondary btn--sm"
                        >
                          + Add &quot;{inputValue.trim()}&quot;
                        </button>
                      )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || selectedRoles.length === 0}
              className={`btn btn--primary btn--lg btn--full${isLoading ? ' btn--loading' : ''}`}
              aria-busy={isLoading}
              style={{ marginTop: '1.5rem' }}
            >
              {isLoading ? 'Saving...' : 'Complete Onboarding'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <AuthGuard requiredRole="candidate">
      <OnboardingForm />
    </AuthGuard>
  )
}

'use client'

import type { Resume } from '@/lib/types/resume'
import type { LucideIcon } from 'lucide-react'
import { Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react'

import { fmtDate } from './resumeUtils'

type ContactItem = {
  key: string
  icon: LucideIcon
  label: string
  href?: string
  text: string
}

function splitDescription(description: string) {
  const lines = description
    .split('\n')
    .map((line) => line.replace(/^[\u2022-]\s*/, '').trim())
    .filter(Boolean)

  if (lines.length > 1) return lines

  return description
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .map((line) => line.replace(/^[\u2022-]\s*/, '').trim())
    .filter(Boolean)
}

function normalizeUrl(url: string) {
  return url.startsWith('http') ? url : `https://${url}`
}

export default function ResumeTemplate({ resume }: { resume: Resume }) {
  const headline = resume.headline || resume.targetRole
  const contactItems = [
    resume.location
      ? {
          key: 'location',
          icon: MapPin,
          label: 'Location',
          text: resume.location,
        }
      : null,
    resume.phone
      ? {
          key: 'phone',
          icon: Phone,
          label: 'Phone',
          href: `tel:${resume.phone.replace(/\s+/g, '')}`,
          text: resume.phone,
        }
      : null,
    resume.email
      ? {
          key: 'email',
          icon: Mail,
          label: 'Email',
          href: `mailto:${resume.email}`,
          text: resume.email,
        }
      : null,
    resume.linkedin_url
      ? {
          key: 'linkedin',
          icon: Linkedin,
          label: 'LinkedIn',
          href: resume.linkedin_url,
          text: 'LinkedIn',
        }
      : null,
    resume.github_url
      ? {
          key: 'github',
          icon: Github,
          label: 'GitHub',
          href: resume.github_url,
          text: 'GitHub',
        }
      : null,
    resume.website && resume.website !== resume.linkedin_url && resume.website !== resume.github_url
      ? {
          key: 'website',
          icon: Globe,
          label: 'Portfolio',
          href: normalizeUrl(resume.website),
          text: 'Portfolio',
        }
      : null,
  ].filter(Boolean) as ContactItem[]

  return (
    <article className="rv-doc resume-page">
      <header className="rv-header">
        <h1 className="rv-header__name">{resume.fullName || 'Your Name'}</h1>
        {headline && <p className="rv-header__headline">{headline}</p>}
        {contactItems.length > 0 && (
          <div className="rv-header__contacts">
            {contactItems.map(({ key, icon: Icon, href, label, text }) => (
              <span className="rv-header__contact" key={key}>
                <Icon className="rv-header__icon" size={11} strokeWidth={1.6} aria-hidden="true" />
                {href ? (
                  <a
                    href={href}
                    className="rv-link"
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={label}
                  >
                    {text}
                  </a>
                ) : (
                  <span>{text}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      {resume.summary && (
        <section className="rv-section">
          <h2 className="rv-section__heading">Summary</h2>
          <p className="rv-section__body">{resume.summary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section className="rv-section">
          <h2 className="rv-section__heading">Skills</h2>
          <div className="rv-skills-block">
            <p className="rv-skills-line">
              <span className="rv-skills-label">Skills:</span> {resume.skills.join(', ')}
            </p>
          </div>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="rv-section">
          <h2 className="rv-section__heading">Experience</h2>
          {resume.experience.map((exp) => {
            const bullets = splitDescription(exp.description)
            const hasDates = exp.startDate || exp.endDate || exp.current

            return (
              <div className="rv-exp" key={exp.id}>
                <div className="rv-exp__topline">
                  <div className="rv-exp__company">{exp.company || 'Company Name'}</div>
                  {hasDates && (
                    <div className="rv-exp__dates">
                      {fmtDate(exp.startDate)} - {exp.current ? 'Present' : fmtDate(exp.endDate)}
                    </div>
                  )}
                </div>
                <div className="rv-exp__titleline">
                  <div className="rv-exp__title">{exp.title || 'Job Title'}</div>
                  {exp.location && <div className="rv-exp__location">{exp.location}</div>}
                </div>
                {bullets.length > 0 && (
                  <ul className="rv-bullets">
                    {bullets.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="rv-section">
          <h2 className="rv-section__heading">Education</h2>
          {resume.education.map((edu) => {
            const hasDates = edu.startDate || edu.endDate

            return (
              <div className="rv-edu" key={edu.id}>
                <div className="rv-exp__topline">
                  <div className="rv-edu__institution">{edu.institution || 'Institution Name'}</div>
                  {hasDates && (
                    <div className="rv-exp__dates">
                      {fmtDate(edu.startDate)} - {fmtDate(edu.endDate)}
                    </div>
                  )}
                </div>
                <div className="rv-exp__titleline">
                  <div className="rv-edu__degree">{edu.degree || 'Degree / Certification'}</div>
                  {(edu.location || edu.gpa) && (
                    <div className="rv-exp__location">
                      {[edu.location, edu.gpa ? `GPA ${edu.gpa}` : null]
                        .filter(Boolean)
                        .join(' | ')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </article>
  )
}

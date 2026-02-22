'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import {
  Send,
  Bot,
  Paperclip,
  MoreHorizontal,
  User,
  FileText,
  ChevronRight,
  Building,
  Layout,
} from 'lucide-react'
import { AppShell } from '../../../components/layout/AppShell'
import { PageTransition } from '../../../components/common'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../../../components/ui/resizable'
import { useAuth } from '../../../hooks/useAuth'
import { cn } from '../../../lib/utils'

const SUGGESTED_PROMPTS = [
  {
    title: 'Screen Candidates',
    text: 'Find candidates rejected 5 months ago with good DevOps knowledge',
    icon: User,
  },
  {
    title: 'Draft Job Description',
    text: 'Write a JD for a Senior Frontend Engineer focusing on React and Next.js',
    icon: FileText,
  },
  {
    title: 'Analyze Pipeline',
    text: 'Show me the current health of the SDE-2 hiring pipeline',
    icon: Layout,
  },
]

type Message = {
  role: 'user' | 'assistant'
  content: string
  time: string
  component?: 'candidate_list' | null
}

type CandidateContext = {
  name: string
  role: string
  status: string
  score: number
  date: string
}

export default function AIAssistantPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Right pane state
  const [activeContext, setActiveContext] = useState<CandidateContext | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/signin'
    }
  }, [isAuthenticated, isLoading])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', content: text, time }])

    // Mocking Generative UI Response
    setTimeout(() => {
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      if (text.toLowerCase().includes('candidate') || text.toLowerCase().includes('devops')) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I found 2 candidates who match your criteria (rejected 5+ months ago, strong DevOps experience):',
            time: aiTime,
            component: 'candidate_list',
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              'I can certainly help with that. Would you like me to draft a quick summary or provide a detailed breakdown?',
            time: aiTime,
          },
        ])
      }
    }, 1000)
  }

  if (isLoading || !isAuthenticated) return null

  return (
    <AppShell>
      <PageTransition className="h-[calc(100vh-64px)] w-full bg-background-surface overflow-hidden">
        <ResizablePanelGroup orientation="horizontal" className="w-full h-full">
          {/* Left Pane: Chat Interface */}
          <ResizablePanel
            defaultSize={60}
            minSize={40}
            className="flex flex-col border-r border-border-default relative"
          >
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto w-full scrollbar-hide">
              <div className="max-w-3xl mx-auto w-full p-6 space-y-8 pb-12">
                {messages.length === 0 ? (
                  /* Welcome Screen / Empty State (The Oasis) */
                  <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
                    <div className="max-w-xl w-full space-y-10">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
                          How can I help you today?
                        </h2>
                        <p className="text-text-secondary text-[15px] text-center max-w-md mx-auto leading-relaxed">
                          I can analyze candidate pipelines, draft communications, and search your
                          organization's talent pool.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {SUGGESTED_PROMPTS.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(prompt.text)}
                            className="flex items-center text-left p-4 w-full rounded-2xl border border-border-subtle bg-background-surface hover:bg-background-muted hover:border-border-default transition-all group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-background-muted flex items-center justify-center mr-4 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/30 group-hover:text-primary-600 transition-colors shrink-0">
                              <prompt.icon className="w-5 h-5 text-text-secondary group-hover:text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[14px] font-bold text-text-primary mb-0.5">
                                {prompt.title}
                              </div>
                              <div className="text-[13px] text-text-tertiary">{prompt.text}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Chat History */
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex w-full animate-in fade-in slide-in-from-bottom-2',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {msg.role === 'user' ? (
                        /* User Message: Brand Blue Bubble */
                        <div className="flex flex-col items-end max-w-[80%]">
                          <div className="px-5 py-3.5 bg-primary-600 text-white rounded-[20px] rounded-tr-sm text-[15px] leading-relaxed shadow-sm">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        /* Assistant Message: Document Style (No Bubble) */
                        <div className="flex w-full max-w-3xl gap-4">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 border border-primary-100 mt-1">
                            <Bot className="w-4 h-4 text-primary-600" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="text-[15px] text-text-primary leading-relaxed pt-1">
                              {msg.content}
                            </div>

                            {/* Generative UI Component Mockup (Candidate Rows) */}
                            {msg.component === 'candidate_list' && (
                              <div className="space-y-3 mt-4">
                                {[
                                  {
                                    name: 'Alex Mercer',
                                    role: 'DevOps Engineer',
                                    status: 'Rejected',
                                    score: 92,
                                    date: 'Oct 2025',
                                  },
                                  {
                                    name: 'Samantha Lee',
                                    role: 'SRE',
                                    status: 'Rejected',
                                    score: 88,
                                    date: 'Nov 2025',
                                  },
                                ].map((candidate, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setActiveContext(candidate)}
                                    className={cn(
                                      'flex items-center justify-between p-4 rounded-xl border bg-background-surface hover:shadow-md transition-all cursor-pointer group',
                                      activeContext?.name === candidate.name
                                        ? 'border-primary-500 ring-1 ring-primary-500/20'
                                        : 'border-border-default hover:border-primary-300'
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-background-muted flex items-center justify-center font-bold text-text-secondary">
                                        {candidate.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="font-bold text-sm text-text-primary group-hover:text-primary-600 transition-colors">
                                          {candidate.name}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                          {candidate.role} • Applied {candidate.date}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <div className="text-xs font-bold text-success-600">
                                          {candidate.score}% Match
                                        </div>
                                      </div>
                                      <Badge
                                        variant="destructive"
                                        className="bg-error-50 text-error-700 hover:bg-error-50 shadow-none border border-error-200"
                                      >
                                        {candidate.status}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-text-muted hidden sm:inline-flex"
                                      >
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background-surface border-t border-border-default mt-auto">
              <div className="max-w-2xl mx-auto">
                <div className="relative flex items-end gap-2 bg-background-surface border border-border-default rounded-2xl p-2 pl-4 focus-within:border-primary-500 shadow-sm focus-within:shadow-md focus-within:ring-4 focus-within:ring-primary-500/10 transition-all">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-text-muted hover:text-text-primary mb-1 shrink-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <textarea
                    rows={1}
                    placeholder="Ask a question... type 'candidate'"
                    className="flex-1 bg-transparent border-none focus:outline-none text-[15px] py-3 resize-none max-h-40 min-h-[44px] text-text-primary placeholder:text-text-muted leading-relaxed"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={e => {
                      const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement
                      if (textarea) {
                        handleSend(textarea.value)
                        textarea.value = ''
                      }
                    }}
                    className="h-9 w-9 rounded-xl bg-primary-600 hover:bg-primary-700 shadow-sm mb-1 shrink-0"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
                <div className="text-center mt-3">
                  <p className="text-[11px] text-text-tertiary">
                    AI-generated content may be incorrect. Please verify information manually.
                  </p>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-border-subtle" />

          {/* Right Pane: Context/Details (40%) */}
          <ResizablePanel
            defaultSize={40}
            minSize={30}
            className={cn(
              'bg-background-subtle relative z-0',
              !activeContext ? 'hidden lg:flex' : 'flex'
            )}
          >
            {activeContext ? (
              <div className="h-full flex flex-col animate-in fade-in duration-300">
                <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-background-surface">
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">Candidate Context</h3>
                    <p className="text-xs text-text-tertiary">{activeContext.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveContext(null)}>
                      Dismiss
                    </Button>
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                      Approve for Interview
                    </Button>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto w-full">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="bg-background-surface border border-border-default rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-xl font-bold text-primary-600 shadow-inner">
                          {activeContext.name.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-text-primary">
                            {activeContext.name}
                          </h2>
                          <p className="text-sm text-text-secondary">{activeContext.role}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-border-subtle">
                        <div>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider font-bold mb-1.5">
                            Status
                          </p>
                          <Badge
                            variant="destructive"
                            className="bg-error-50 text-error-700 border-error-200"
                          >
                            {activeContext.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider font-bold mb-1.5">
                            AI Match Score
                          </p>
                          <span className="text-base font-bold text-success-600">
                            {activeContext.score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-background-surface border border-border-default rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-5 h-5 text-primary-500" />
                        <p className="text-xs text-text-primary uppercase tracking-wider font-bold">
                          AI Evaluation
                        </p>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed bg-background-muted p-4 rounded-xl border border-border-subtle shadow-inner">
                        Strong technical background in DevOps and CI/CD pipelines. Rejected
                        previously due to salary expectations mismatch, not technical ability.
                        Highly recommended to re-engage for the new SDE-2 opening.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-background-subtle border-l border-border-subtle">
                <div className="max-w-[320px] flex flex-col items-center">
                  <Building className="w-16 h-16 mb-6 text-text-tertiary opacity-20" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    No Context Selected
                  </h3>
                  <p className="text-[14px] text-text-tertiary leading-relaxed mb-8">
                    Select a candidate, document, or analytic view from the chat to inspect it here.
                  </p>
                  <div className="flex flex-row gap-4">
                    <button
                      onClick={() => handleSend('Draft Job Description')}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border border-border-default bg-background-surface text-text-primary hover:bg-background-muted transition-colors shadow-sm"
                    >
                      <FileText className="w-4 h-4 mr-2 text-text-tertiary" /> Draft JD
                    </button>
                    <button
                      onClick={() => handleSend('Show Pending Alerts')}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border border-border-default bg-background-surface text-text-primary hover:bg-background-muted transition-colors shadow-sm"
                    >
                      <Layout className="w-4 h-4 mr-2 text-text-tertiary" /> View Alerts
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </PageTransition>
    </AppShell>
  )
}

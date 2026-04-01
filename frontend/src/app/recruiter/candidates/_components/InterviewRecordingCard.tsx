'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import {
  type InterviewRecording,
  useDeleteRecordingMutation,
  useGetRecordingsQuery,
  useTranscribeRecordingMutation,
  useUploadRecordingMutation,
} from '@/store/services/recordingsApi'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Save,
  Square,
  Trash2,
  X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const STATUS_LABELS: Record<string, string> = {
  uploaded: 'Uploaded',
  transcribing: 'Transcribing…',
  transcribed: 'Transcribed',
  evaluating: 'Evaluating…',
  evaluated: 'Evaluated',
  failed: 'Failed',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  applicationId: string
}

type RecorderState = 'idle' | 'recording' | 'paused' | 'preview'

export default function InterviewRecordingCard({ applicationId }: Props) {
  // ---- API hooks ----
  const { data: resp, isLoading: isLoadingRecordings } = useGetRecordingsQuery(applicationId)
  const [uploadRecording, { isLoading: isUploading }] = useUploadRecordingMutation()
  const [transcribeRecording, { isLoading: isTranscribing }] = useTranscribeRecordingMutation()
  const [deleteRecording] = useDeleteRecordingMutation()

  const recordings = resp?.data ?? []

  // ---- Local recorder state ----
  const [recorderState, setRecorderState] = useState<RecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const frequencyDataRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // ---- Cleanup ----
  const drawVisualizer = useCallback((flatten = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    ctx.clearRect(0, 0, width, height)

    const baselineY = height - 8
    const barCount = 28
    const gap = 4
    const available = width - gap * (barCount - 1)
    const barWidth = Math.max(3, available / barCount)
    const radius = Math.min(3.5, barWidth / 2)
    const maxBarHeight = Math.max(6, height - 14)

    const analyser = analyserRef.current
    const frequencyData = frequencyDataRef.current

    if (!flatten && analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>)
    }

    ctx.fillStyle = '#2563eb'

    for (let i = 0; i < barCount; i += 1) {
      const x = i * (barWidth + gap)
      const value =
        !flatten && frequencyData
          ? (frequencyData[Math.floor((i / barCount) * frequencyData.length)] ?? 0)
          : 0
      const normalized = value / 255
      const h = flatten ? 2 : Math.max(2, normalized * maxBarHeight)
      const yTop = baselineY - h
      const yNeck = yTop + radius

      ctx.beginPath()
      ctx.moveTo(x, baselineY)
      ctx.lineTo(x, yNeck)
      ctx.arc(x + radius, yNeck, radius, Math.PI, 1.5 * Math.PI)
      ctx.lineTo(x + barWidth - radius, yTop)
      ctx.arc(x + barWidth - radius, yNeck, radius, 1.5 * Math.PI, 0)
      ctx.lineTo(x + barWidth, baselineY)
      ctx.closePath()
      ctx.fill()
    }
  }, [])

  const startVisualizerLoop = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)

    const tick = () => {
      drawVisualizer(false)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    tick()
  }, [drawVisualizer])

  const stopVisualizerLoop = useCallback(
    (flatten = true) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      drawVisualizer(flatten)
    },
    [drawVisualizer],
  )

  const stopMediaTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetRecorder = useCallback(() => {
    clearTimer()
    stopMediaTracks()
    stopVisualizerLoop(true)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setRecorderState('idle')
    setSeconds(0)
    setAudioBlob(null)
    setPreviewUrl(null)
    chunksRef.current = []
    mediaRecorderRef.current = null
  }, [clearTimer, stopMediaTracks, stopVisualizerLoop, previewUrl])

  useEffect(() => {
    drawVisualizer(true)
  }, [drawVisualizer])

  useEffect(() => {
    if (recorderState === 'recording') {
      startVisualizerLoop()
      return
    }
    stopVisualizerLoop(true)
  }, [recorderState, startVisualizerLoop, stopVisualizerLoop])

  useEffect(() => {
    return () => {
      clearTimer()
      stopMediaTracks()
      stopVisualizerLoop(true)
      analyserRef.current?.disconnect()
      analyserRef.current = null
      audioContextRef.current?.close()
      audioContextRef.current = null
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Recording actions ----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)
      analyserRef.current = analyser
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount)

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
        setRecorderState('preview')
        stopVisualizerLoop(true)
        analyserRef.current?.disconnect()
        analyserRef.current = null
        frequencyDataRef.current = null
        stopMediaTracks()
      }

      recorder.start(250)
      setRecorderState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } catch {
      toast.error('Could not access your microphone. Please check browser permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      clearTimer()
      setRecorderState('paused')
      stopVisualizerLoop(true)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
      setRecorderState('recording')
      startVisualizerLoop()
    }
  }

  const stopRecording = () => {
    clearTimer()
    mediaRecorderRef.current?.stop()
  }

  const cancelRecording = () => {
    clearTimer()
    mediaRecorderRef.current?.stop()
    resetRecorder()
  }

  // ---- Save ----
  const handleSave = async () => {
    if (!audioBlob) return
    try {
      await uploadRecording({
        applicationId,
        file: audioBlob,
        durationSeconds: seconds,
      }).unwrap()
      toast.success('Recording saved.')
      resetRecorder()
    } catch {
      toast.error('Failed to save recording.')
    }
  }

  // ---- Transcribe / evaluate ----
  const handleTranscribe = async (recordingId: string) => {
    try {
      await transcribeRecording(recordingId).unwrap()
      toast.success('Transcription complete.')
    } catch {
      toast.error('Transcription failed.')
    }
  }

  const handleDelete = async (recordingId: string) => {
    try {
      await deleteRecording({ recordingId, applicationId }).unwrap()
      toast.success('Recording deleted.')
    } catch {
      toast.error('Failed to delete recording.')
    }
  }

  // ---- Render ----
  const isRecording = recorderState === 'recording' || recorderState === 'paused'
  const recordingClass = recorderState === 'recording' ? 'rec-card__recording--active' : ''

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <div>
          <div className="dash-card__title">Interview recording</div>
          <div className="dash-card__subtitle">Record and transcribe the interview.</div>
        </div>
      </div>

      <div className="dash-card__body rec-card">
        {/* ====== STATE: idle — show Start button ====== */}
        {recorderState === 'idle' && (
          <div className="rec-card__empty">
            <button className="rec-card__startBtn" onClick={startRecording} type="button">
              <Mic size={18} />
              Start recording
            </button>
          </div>
        )}

        {/* ====== STATE: recording / paused ====== */}
        {isRecording && (
          <div className={`rec-card__recording ${recordingClass}`}>
            <div className="rec-card__indicator">
              <span
                className={`rec-card__dot ${recorderState === 'recording' ? 'rec-card__dot--pulse rec-card__mic--recording' : 'rec-card__dot--paused'}`}
              />
              <span className="rec-card__timer">{formatTimer(seconds)}</span>
              {recorderState === 'paused' && <span className="rec-card__pauseLabel">Paused</span>}
            </div>

            <canvas
              ref={canvasRef}
              className="rec-card__visualizer"
              width={560}
              height={84}
              aria-label="Audio frequency visualizer"
              role="img"
            />

            <div className="rec-card__actions">
              {recorderState === 'recording' ? (
                <button
                  className="rec-card__actionBtn rec-card__actionBtn--secondary"
                  onClick={pauseRecording}
                  type="button"
                  title="Pause"
                >
                  <Pause size={16} />
                </button>
              ) : (
                <button
                  className="rec-card__actionBtn rec-card__actionBtn--secondary"
                  onClick={resumeRecording}
                  type="button"
                  title="Resume"
                >
                  <Play size={16} />
                </button>
              )}
              <button
                className="rec-card__actionBtn rec-card__actionBtn--stop"
                onClick={stopRecording}
                type="button"
                title="Stop"
              >
                <Square size={16} />
              </button>
              <button
                className="rec-card__actionBtn rec-card__actionBtn--cancel"
                onClick={cancelRecording}
                type="button"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ====== STATE: preview — play & save ====== */}
        {recorderState === 'preview' && previewUrl && (
          <div className="rec-card__preview">
            {}
            <audio controls src={previewUrl} className="rec-card__audio" />

            <div className="rec-card__previewActions">
              <button
                className="rec-card__actionBtn rec-card__actionBtn--primary"
                onClick={handleSave}
                disabled={isUploading}
                type="button"
              >
                {isUploading ? (
                  <Loader2 size={16} className="rec-card__spin" />
                ) : (
                  <Save size={16} />
                )}
                {isUploading ? 'Saving…' : 'Save'}
              </button>
              <button
                className="rec-card__actionBtn rec-card__actionBtn--secondary"
                onClick={resetRecorder}
                disabled={isUploading}
                type="button"
              >
                <RotateCcw size={16} /> Redo
              </button>
            </div>
          </div>
        )}

        {/* ====== Saved recordings list ====== */}
        {isLoadingRecordings && recorderState === 'idle' && (
          <div className="rec-card__loading">
            <Loader2 size={16} className="rec-card__spin" /> Loading recordings…
          </div>
        )}

        {recordings.length > 0 && (
          <div className="rec-card__list">
            {recordings.map((rec) => (
              <RecordingItem
                key={rec.id}
                rec={rec}
                onTranscribe={handleTranscribe}
                onDelete={handleDelete}
                isTranscribing={isTranscribing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RecordingItem — individual saved recording
// ---------------------------------------------------------------------------

function RecordingItem({
  rec,
  onTranscribe,
  onDelete,
  isTranscribing,
}: {
  rec: InterviewRecording
  onTranscribe: (id: string) => void
  onDelete: (id: string) => void
  isTranscribing: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isProcessing = rec.status === 'transcribing' || rec.status === 'evaluating'

  return (
    <div className="rec-item">
      <div className="rec-item__header">
        {}
        <audio controls src={rec.s3_audio_url} className="rec-card__audio" />

        <div className="rec-item__meta">
          <span className={`rec-item__status rec-item__status--${rec.status}`}>
            {isProcessing && <Loader2 size={12} className="rec-card__spin" />}
            {rec.status === 'evaluated' && <CheckCircle2 size={12} />}
            {rec.status === 'failed' && <AlertCircle size={12} />}
            {STATUS_LABELS[rec.status] ?? rec.status}
          </span>
          {rec.duration_seconds != null && (
            <span className="rec-item__duration">{formatTimer(rec.duration_seconds)}</span>
          )}
        </div>

        <div className="rec-item__actions">
          {(rec.status === 'uploaded' || rec.status === 'failed') && (
            <button
              className="rec-card__actionBtn rec-card__actionBtn--primary"
              onClick={() => onTranscribe(rec.id)}
              disabled={isTranscribing}
              type="button"
              title="Transcribe"
            >
              {isTranscribing ? (
                <Loader2 size={14} className="rec-card__spin" />
              ) : (
                <Mic size={14} />
              )}
              Transcribe
            </button>
          )}

          <button
            className="rec-card__actionBtn rec-card__actionBtn--cancel"
            onClick={() => onDelete(rec.id)}
            type="button"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Transcript */}
      {rec.transcript && (
        <div className="rec-item__section">
          <button
            className="rec-item__toggle"
            onClick={() => setExpanded((prev) => !prev)}
            type="button"
          >
            {expanded ? 'Hide transcript' : 'Show transcript'}
          </button>
          {expanded && <p className="rec-item__text">{rec.transcript}</p>}
        </div>
      )}
    </div>
  )
}

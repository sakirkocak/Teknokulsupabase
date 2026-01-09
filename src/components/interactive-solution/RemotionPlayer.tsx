'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import { SolutionVideo } from '@/remotion/compositions/SolutionVideo'
import { VideoProps, SolutionStep } from '@/remotion/types'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from 'lucide-react'

interface RemotionPlayerProps {
  questionText: string
  subjectName: string
  steps: SolutionStep[]
  correctAnswer: string
  audioUrls?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VideoComponent = SolutionVideo as any

export const RemotionPlayer: React.FC<RemotionPlayerProps> = ({
  questionText,
  subjectName,
  steps,
  correctAnswer,
  audioUrls = []
}) => {
  const playerRef = React.useRef<PlayerRef>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

  const fps = 30
  const introFrames = 4 * fps
  const outroFrames = 5 * fps
  const stepsFrames = steps.reduce((sum, s) => sum + (s.duration_seconds || 6) * fps, 0)
  const totalFrames = introFrames + stepsFrames + outroFrames

  // Video props
  const videoProps: VideoProps = useMemo(() => ({
    questionText,
    subjectName,
    steps,
    correctAnswer,
    audioUrls
  }), [questionText, subjectName, steps, correctAnswer, audioUrls])

  // Current step calculation
  const currentStep = useMemo(() => {
    if (currentFrame < introFrames) return -1 // Intro
    let frameCount = introFrames
    for (let i = 0; i < steps.length; i++) {
      const stepFrames = (steps[i].duration_seconds || 6) * fps
      if (currentFrame < frameCount + stepFrames) return i
      frameCount += stepFrames
    }
    return steps.length // Outro
  }, [currentFrame, steps, introFrames, fps])

  // Controls
  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const restart = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.seekTo(0)
      playerRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(isMuted ? 1 : 0)
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const goToStep = useCallback((stepIndex: number) => {
    if (playerRef.current) {
      let targetFrame = introFrames
      for (let i = 0; i < stepIndex; i++) {
        targetFrame += (steps[i].duration_seconds || 6) * fps
      }
      playerRef.current.seekTo(targetFrame)
    }
  }, [steps, introFrames, fps])

  const skipBack = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    } else {
      goToStep(0)
    }
  }, [currentStep, goToStep])

  const skipForward = useCallback(() => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, steps.length, goToStep])

  const goFullscreen = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.requestFullscreen()
    }
  }, [])

  // Progress percentage
  const progress = (currentFrame / totalFrames) * 100

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-2xl overflow-hidden">
      {/* Video Area */}
      <div className="flex-1 relative min-h-[400px]">
        <Player
          ref={playerRef}
          component={VideoComponent}
          inputProps={videoProps}
          durationInFrames={totalFrames}
          fps={fps}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{ width: '100%', height: '100%' }}
          controls={false}
          loop={false}
          autoPlay={false}
        />
        
        {/* Overlay controls on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-xl"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-gray-800" />
            ) : (
              <Play className="w-10 h-10 text-gray-800 ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={restart}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
            title="Başa dön"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={skipBack}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
            title="Önceki adım"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={skipForward}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
            title="Sonraki adım"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => goToStep(i)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                i === currentStep
                  ? 'bg-indigo-600 text-white scale-110'
                  : i < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title={step.title}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
            title={isMuted ? 'Sesi aç' : 'Sesi kapat'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <button
            onClick={goFullscreen}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
            title="Tam ekran"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Current Step Info */}
      {currentStep >= 0 && currentStep < steps.length && (
        <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-indigo-600/30 text-indigo-300 text-xs font-medium">
              Adım {currentStep + 1}/{steps.length}
            </span>
            <h4 className="text-white font-medium">{steps[currentStep].title}</h4>
          </div>
        </div>
      )}
    </div>
  )
}

export default RemotionPlayer

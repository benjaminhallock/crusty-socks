import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_CONSTANTS, GAME_STATE } from '../../constants'
import Button from '../common/ui/Button'

const HiddenWord = ({ lobby, user, onWordPick }) => {
  const [timeLeft, setTimeLeft] = useState(0)
  const [wordChoices, setWordChoices] = useState([])
  const lastTickRef = useRef(null)
  const animationFrameRef = useRef(null)
  const serverTimeOffsetRef = useRef(0)

  const WORD_SELECTION_TIME = GAME_CONSTANTS.WORD_SELECTION_TIME || 30
  const isDrawing = user?.username === lobby.currentDrawer

  // Simplified timer update logic
  const updateTimer = useCallback(
    timestamp => {
      if (!lastTickRef.current) lastTickRef.current = timestamp

      if (timestamp - lastTickRef.current >= 1000) {
        const currentTime = Date.now() - serverTimeOffsetRef.current
        const startTime = new Date(lobby.startTime).getTime()
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)

        const timeLimit =
          lobby.gameState === GAME_STATE.DRAWING ? lobby.roundTime : WORD_SELECTION_TIME

        setTimeLeft(Math.max(0, timeLimit - elapsedSeconds))
        lastTickRef.current = timestamp
      }

      if (timeLeft > 0) {
        animationFrameRef.current = requestAnimationFrame(updateTimer)
      }
    },
    [lobby.gameState, lobby.startTime, lobby.roundTime, timeLeft],
  )

  // Timer effect
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Skip timer setup for non-active states
    if (lobby.gameState !== GAME_STATE.DRAWING && lobby.gameState !== GAME_STATE.PICKING_WORD) {
      setTimeLeft(0) // Reset timer when not in active state
      return
    }

    // Calculate initial time left
    const currentTime = Date.now()
    let initialTimeLeft = 0

    if (lobby.gameState === GAME_STATE.DRAWING && lobby.startTime) {
      const startTime = new Date(lobby.startTime).getTime()
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
      initialTimeLeft = Math.max(0, lobby.roundTime - elapsedSeconds)
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD && lobby.startTime) {
      const startTime = new Date(lobby.startTime).getTime()
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)
      initialTimeLeft = Math.max(0, WORD_SELECTION_TIME - elapsedSeconds)
    }

    // Ensure we set timeLeft even if it's 0
    setTimeLeft(initialTimeLeft)
    lastTickRef.current = null

    // Only start animation if we have time left
    if (initialTimeLeft > 0) {
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [lobby.gameState, lobby.startTime, lobby.roundTime, updateTimer])

  // Word selection effect - simplified
  useEffect(() => {
    if (lobby.gameState === GAME_STATE.PICKING_WORD && isDrawing) {
      setWordChoices(lobby.currentWord?.split(',').map(w => w.trim()) || [])
    }
  }, [lobby.gameState, lobby.currentWord, isDrawing])

  // Calculate width based on the correct time limit for each state
  const getTimerWidth = () => {
    if (!timeLeft) return 0

    if (lobby.gameState === GAME_STATE.DRAWING) {
      return (timeLeft / lobby.roundTime) * 100
    } else if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      return (timeLeft / WORD_SELECTION_TIME) * 100
    }
    return 100
  }

  // Get timer bar color based on time remaining and game state
  const getTimerColor = () => {
    if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      return timeLeft <= 5 ? 'bg-amber-400 animate-pulse' : 'bg-indigo-400'
    }

    if (lobby.gameState === GAME_STATE.DRAWING) {
      if (timeLeft <= 10) return 'bg-red-400 animate-pulse'
      if (timeLeft <= 30) return 'bg-amber-400'
      return 'bg-emerald-400'
    }

    return 'bg-indigo-400'
  }

  // Determine which letters to reveal based on the reveal percentage
  const getLetterRevealIndices = (word, revealPercentage) => {
    if (!word) return new Set()
    const letters = word.split('')
    const revealIndices = new Set()

    // Always reveal spaces
    letters.forEach((char, idx) => {
      if (char === ' ') revealIndices.add(idx)
    })

    // Use characters' charCode sum as a seed for deterministic reveals
    const wordSeed = word.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) // split characters to get their charCode

    // Sort positions based on character codes and seed
    const positions = Array.from({ length: word.length }, (_, i) => i)
      .filter(i => !revealIndices.has(i))
      .sort((a, b) => {
        const scoreA = (word[a].charCodeAt(0) * wordSeed) % word.length
        const scoreB = (word[b].charCodeAt(0) * wordSeed) % word.length
        return scoreA - scoreB
      })

    // Calculate the number of letters to reveal based on the percentage
    const numToReveal = Math.floor((letters.length * revealPercentage) / 100)
    for (let i = 0; i < numToReveal && i < positions.length; i++) {
      revealIndices.add(positions[i])
    }

    return revealIndices
  }

  // Add helper to determine if word should be shown
  const shouldShowWord = () => {
    if (lobby.gameState === GAME_STATE.PICKING_WORD) return false
    if (!lobby.currentWord || !lobby.gameState) return false
    if (lobby.gameState === GAME_STATE.WAITING) return false
    return true
  }

  // Generate the masked word with revealed letters
  const getMaskedWord = () => {
    if (!shouldShowWord()) return ''

    // // Early returns for empty statess
    if (!lobby.currentWord) {
      console.log('No word available')
      return '_____'
    }

    // Show full word for drawer
    if (isDrawing) {
      return lobby.currentWord
    }

    // Always show word in these states
    if (
      [GAME_STATE.DRAW_END, GAME_STATE.ROUND_END, GAME_STATE.FINISHED].includes(lobby.gameState)
    ) {
      return lobby.currentWord
    }

    // Handle drawing state for non-drawers
    if (lobby.gameState === GAME_STATE.DRAWING) {
      const letters = lobby.currentWord.split('')
      const currentRevealPercentage = getCurrentRevealPercentage()
      const revealIndices = getLetterRevealIndices(lobby.currentWord, currentRevealPercentage)

      console.log('Masking word:', {
        word: lobby.currentWord,
        revealed: currentRevealPercentage,
        indices: [...revealIndices],
      })

      return letters
        .map((char, idx) => {
          if (revealIndices.has(idx)) return char
          return char === ' ' ? '\u00A0\u00A0' : '_'
        })
        .join('\u00A0')
    }

    if (lobby.gameState === GAME_STATE.WAITING || lobby.gameState === GAME_STATE.PICKING_WORD) {
      return ''
    }

    return '_____'
  }

  //Calc reveal percentage based on elapsed time
  const getCurrentRevealPercentage = () => {
    if (lobby.gameState !== GAME_STATE.DRAWING || !lobby.revealCharacters) return 0 // No reveal percentage

    // Calculate elapsed time
    const elapsed = lobby.roundTime - timeLeft
    const percentage = (elapsed / lobby.roundTime) * 100

    return Math.min(percentage * (lobby.revealCharacters / 100), lobby.revealCharacters)
  }

  // Generate the status text based on the game state
  const getStatusText = () => {
    const roundDisplay =
      lobby.gameState !== GAME_STATE.WAITING
        ? `Round ${lobby.currentRound || 1}/${lobby.maxRounds} - `
        : ''

    if (lobby.gameState === GAME_STATE.WAITING) {
      return 'Waiting for players...'
    }
    if (lobby.gameState === GAME_STATE.PICKING_WORD) {
      return `${roundDisplay}${
        isDrawing ? 'Choose your word!' : `Waiting for word ${lobby.currentDrawer} to choose...`
      }`
    }
    if (lobby.gameState === GAME_STATE.DRAWING) {
      return `${roundDisplay}Time left: ${timeLeft}s`
    }
    if (lobby.gameState === GAME_STATE.DRAW_END) {
      return `${roundDisplay}Time's up! The word was: ${lobby.currentWord}`
    }
    if (lobby.gameState === GAME_STATE.ROUND_END) {
      return `${roundDisplay}Round complete!`
    }
    if (lobby.gameState === GAME_STATE.FINISHED) {
      return 'Game Over!'
    }
    return ''
  }

  return (
    <div className='flex flex-col items-center p-4 bg-white/80 dark:bg-gray-800/80 rounded'>
      <div className='flex flex-col items-center w-full'>
        <div className='text-3xl font-mono text-black dark:text-white font-bold'>
          <span className={timeLeft < 10 ? 'text-red-600 dark:text-red-400' : ''}>
            {getMaskedWord() || '\u00A0'}
          </span>
        </div>

        <div className='w-full max-w-xl mt-2'>
          <div className='h-2 bg-gray-200 dark:bg-gray-600 relative'>
            <div
              className={`absolute h-full ${getTimerColor()}`}
              style={{ width: `${getTimerWidth()}%` }}
            />
          </div>
        </div>

        <div className='mt-1 text-gray-600 dark:text-gray-300'>{getStatusText()}</div>
      </div>

      {lobby.gameState === GAME_STATE.PICKING_WORD && isDrawing && (
        <div className='mt-3 flex gap-2'>
          {wordChoices.slice(0, lobby.selectWord || 3).map((word, i) => (
            <Button
              key={i}
              variant='secondary'
              onClick={() => onWordPick(word)}>
              {word}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export default HiddenWord

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ContextMenu from './ContextMenu'
import ReportModal from './ReportModal'
import { GAME_STATE } from '../../constants'
import { socketManager } from '../../services/socketManager'

const PlayerList = ({
  players,
  drawerUsername,
  roomId,
  gameState,
  currentUsername,
  isAdmin,
  chatLogs = [],
  onStartGame,
}) => {
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [reportModal, setReportModal] = useState(null)

  const handleInviteLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setShowPopup(true)
    setTimeout(() => setShowPopup(false), 2000)
  }

  const handlePlayerClick = (e, player) => {
    e.preventDefault()
    if (player.username === currentUsername) {
      return setContextMenu({
        x: e.pageX,
        y: e.pageY,
        options: [
          {
            label: 'Leave Game',
            onClick: () => socketManager.leaveLobby(roomId),
            isDestructive: true,
          },
        ],
      })
    }
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      options: [
        {
          label: 'View Profile',
          onClick: () => window.open(`/user/${player.username}`, '_blank'),
        },
        {
          label: 'Report Player',
          onClick: () => setReportModal(player.username),
        },
        {
          label: 'Kick Player',
          onClick: () => socketManager.kickPlayer(roomId, player.username),
          isDestructive: true,
          disabled: !isAdmin,
        },
      ],
    })
  }

  const getPlayerBackgroundClass = (player) => {
    if (gameState === GAME_STATE.DRAWING) {
      if (player.username === drawerUsername) {
        return 'bg-emerald-200 dark:bg-emerald-800'
      }
      if (player.hasGuessedCorrect) {
        return 'bg-green-200 dark:bg-green-800'
      }
    }
    if (player.username === currentUsername) {
      return 'bg-white/50 dark:bg-gray-800/50'
    }
    return 'bg-gray-200/50 dark:bg-gray-600/50'
  }

  return (
    <div className='bg-gray-100 dark:bg-gray-700 p-2 shadow-lg relative flex-1 flex flex-col transition-colors'>
      <div className='flex justify-between items-center mb-2'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-gray-200'>Players</h3>
        <div className='relative'>
          <button
            className='bg-indigo-600 text-white px-2 py-1 rounded-md mr-2 hover:bg-indigo-700'
            onClick={handleInviteLink}
          >
            Invite
          </button>
          <button
            className='bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={onStartGame}
            disabled={gameState !== GAME_STATE.WAITING}
          >
            Start Game
          </button>
          {showPopup && (
            <div className='absolute top-0 left-full ml-4 bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50'>
              Link copied to clipboard!
            </div>
          )}
        </div>
      </div>
      <ul className='space-y-1 overflow-y-auto'>
        {players.map((player, index) => (
          <li
            key={`player-${player.username}-${index}`}
            onClick={(e) => handlePlayerClick(e, player)}
            onContextMenu={(e) => {
              e.preventDefault()
              handlePlayerClick(e, player)
            }}
            className={`flex items-center gap-2 p-2 rounded-md transition-colors duration-200 cursor-pointer relative
              ${getPlayerBackgroundClass(player)}
              ${player.hasDrawn ? 'opacity-75' : 'hover:opacity-90'}`}
          >
            {drawerUsername === player.username && gameState !== GAME_STATE.WAITING ? (
              <img
                src='/pencil.gif'
                alt='drawing'
                className='w-8 h-8 rounded-full'
              />
            ) : !player.hasDrawn ? (
              <div className='w-8 h-8 rounded-full bg-gray-000 dark:bg-grey-250 flex items-center justify-center'>
                <svg
                  className='h-5 w-5 text-gray-800 dark:text-gray-100'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </div>
            ) : null}
            <span className='flex justify-between w-full text-gray-800 dark:text-gray-200 font-medium text-sm'>
              <span className='flex items-center gap-2'>
                {player.username}
                {player.hasGuessedCorrect && player.username !== drawerUsername && (
                  <span className='text-xs text-green-600 dark:text-green-400'>
                    Guessed!
                  </span>
                )}
              </span>
              <span>{player.score}</span>
            </span>
          </li>
        ))}
      </ul>
      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
      {reportModal && (
        <ReportModal
          reportedUser={reportModal}
          onClose={() => setReportModal(null)}
          chatLogs={chatLogs}
          currentUsername={currentUsername}
          roomId={roomId}
        />
      )}
    </div>
  )
}

export default PlayerList

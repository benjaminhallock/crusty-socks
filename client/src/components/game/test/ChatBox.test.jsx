import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatBox from '../ChatBox'
import { socketManager } from '../../../services/socketManager'

// Mock socketManager
jest.mock('../../services/socketManager', () => ({
  socketManager: {
    isConnected: jest.fn(),
    sendMessage: jest.fn(),
    requestChatHistory: jest.fn(),
    onMessage: jest.fn(() => jest.fn()),
    onChatHistory: jest.fn(() => jest.fn()),
  },
}))

describe('ChatBox', () => {
  const mockUser = { username: 'testUser' }
  const mockProps = {
    user: mockUser,
    roomId: 'room123',
    lobbyObjectId: 'lobby123',
    gameState: 'waiting',
    currentWord: '',
    currentDrawer: '',
  }

  beforeEach(() => {
    socketManager.isConnected.mockReturnValue(true)
  })

  it('renders without crashing', () => {
    render(<ChatBox {...mockProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('handles message submission correctly', () => {
    render(<ChatBox {...mockProps} />)
    const input = screen.getByRole('textbox')
    const form = screen.getByRole('form')

    fireEvent.change(input, { target: { value: 'test message' } })
    fireEvent.submit(form)

    expect(socketManager.sendMessage).toHaveBeenCalledWith(
      mockProps.lobbyObjectId,
      'test message',
      mockUser.username
    )
    expect(input.value).toBe('')
  })
})

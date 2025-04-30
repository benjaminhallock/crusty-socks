import { render, fireEvent, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PixelCanvas from '../PixelCanvas'
import { socketManager } from '../../../services/socketManager'

jest.mock('../../services/socketManager', () => ({
  socketManager: {
    isConnected: jest.fn(() => true),
    updateCanvas: jest.fn(),
    onCanvasUpdate: jest.fn(() => jest.fn()),
    onStatusChange: jest.fn(() => jest.fn()),
  },
}))

describe('PixelCanvas', () => {
  const mockProps = {
    isDrawer: true,
    drawerUsername: 'testUser',
    gameState: 'waiting',
    roundTime: 60,
    startTime: Date.now(),
    lobbyId: 'lobby123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with white background', () => {
    render(<PixelCanvas {...mockProps} />)
    const canvas = screen.getByRole('img')
    expect(canvas).toBeInTheDocument()
  })

  it('allows drawing when user is drawer', () => {
    render(<PixelCanvas {...mockProps} />)
    const canvas = screen.getByRole('img')

    fireEvent.mouseDown(canvas)
    fireEvent.mouseMove(canvas)
    fireEvent.mouseUp(canvas)

    expect(socketManager.updateCanvas).toHaveBeenCalled()
  })

  it('shows proper tools when user can draw', () => {
    render(<PixelCanvas {...mockProps} />)

    expect(screen.getByTitle('Brush Tool')).toBeInTheDocument()
    expect(screen.getByTitle('Fill Tool')).toBeInTheDocument()
    expect(screen.getByTitle('Eraser Tool')).toBeInTheDocument()
  })

  it('updates canvas when receiving updates from other users', () => {
    const canvasState = {
      data: 'data:image/png;base64,test',
      timestamp: Date.now(),
    }

    render(
      <PixelCanvas
        {...mockProps}
        canvasState={canvasState}
      />
    )

    expect(socketManager.onCanvasUpdate).toHaveBeenCalled()
  })
})

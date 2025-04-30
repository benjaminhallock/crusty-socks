import express from 'express'
import { chatController } from '../controllers/chatController.js'
import { auth, isAdmin } from '../middleware/auth.js'

const router = express.Router()

router.get('/all', auth, isAdmin, chatController.getAllChats)
router.get('/:lobbyObjectId', auth, chatController.getChatByLobbyId)
router.get('/:lobbyObjectId/:userId', auth, chatController.getChatByUserInLobby)

export default router

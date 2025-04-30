import express from 'express'

import { lobbyController } from '../controllers/lobbyController.js'
import { auth, isAdmin } from '../middleware/auth.js'

const router = express.Router()

router.get('/all', auth, isAdmin, lobbyController.getAllLobbies)
router.put('/:lobbyId', auth, isAdmin, lobbyController.updateLobby)

router.get('/:roomId', auth, lobbyController.getLobbyById)
router.post('/create', auth, lobbyController.createLobby)
router.post('/leave', auth, lobbyController.leaveLobby)

export default router

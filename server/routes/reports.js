import express from 'express'

import { reportController } from '../controllers/reportController.js'
import { auth, isAdmin } from '../middleware/auth.js'

const router = express.Router()

router.post('/create', auth, reportController.createReport)

router.get('/all', auth, isAdmin, reportController.getAllReports)
router.get('/:id', auth, isAdmin, reportController.getReportById)
router.put('/update/:id', auth, isAdmin, reportController.updateReportStatus)
router.put('/:id', auth, isAdmin, reportController.updateReport)
router.get('/user/:userId', auth, isAdmin, reportController.getReportsByUserId)
export default router

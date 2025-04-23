import Report from '../models/report.js'

export const reportController = {
	// Get all reports (admin only)
	getAllReports: async (req, res) => {
		try {
			const reports = await Report.find().sort({ timestamp: -1 })
			res.json({ success: true, reports })
		} catch (err) {
			res.status(500).json({ success: false, message: err.message })
		}
	},

	// Get a single report by ID
	getReportById: async (req, res) => {
		try {
			const report = await Report.findById(req.params.id)

			if (!report) {
				return res.status(404).json({
					success: false,
					message: 'Report not found',
				})
			}

			res.json({ success: true, report })
		} catch (err) {
			res.status(500).json({
				success: false,
				message: err.message,
			})
		}
	},

	// Create a new report
	createReport: async (req, res) => {
		try {
			// Log the full request body for debugging
			console.log('Full request body:', req.body)

			const { reportedUser, reason, additionalComments, chatLogs, roomId, canvasData } = req.body

			// Enhanced validation for roomId
			if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
				console.error('Invalid or missing roomId:', roomId)
				return res.status(400).json({
					success: false,
					message: 'Valid room ID is required',
					receivedValue: roomId,
				})
			}

			if (!reportedUser) {
				return res.status(400).json({
					success: false,
					message: 'Reported user is required',
				})
			}

			if (!req.user || !req.user.username) {
				return res.status(401).json({
					success: false,
					message: 'Authentication required - no valid user found',
				})
			}

			// Create report with validated roomId
			const report = new Report({
				reportedUser,
				reportedBy: req.user.username,
				roomId: roomId.trim(), // Ensure clean roomId
				reason: reason || 'Inappropriate behavior',
				additionalComments: additionalComments || '',
				timestamp: Date.now(),
				chatLogs: Array.isArray(chatLogs)
					? chatLogs.map(log => ({
							username: log.username || 'Unknown',
							message: log.message || '',
							timestamp: log.timestamp || Date.now(),
					  }))
					: [],
				status: 'pending',
				canvasData: canvasData || null,
			})

			await report.save()
			console.log('Report saved successfully:', {
				id: report._id,
				roomId: report.roomId,
				reportedUser: report.reportedUser,
			})

			res.status(201).json({
				success: true,
				report,
			})
		} catch (err) {
			console.error('Report creation error:', err)
			console.error('Request body:', req.body)
			res.status(500).json({
				success: false,
				message: err.message || 'Internal server error during report creation',
				details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
			})
		}
	},

	// Update report status
	updateReportStatus: async (req, res) => {
		try {
			const { status } = req.body
			const { id } = req.params

			if (!id) {
				return res.status(400).json({
					success: false,
					message: 'Report ID is required',
				})
			}

			if (!['pending', 'reviewed', 'resolved'].includes(status)) {
				return res.status(400).json({
					success: false,
					message: 'Invalid status',
				})
			}

			const report = await Report.findByIdAndUpdate(id, { status }, { new: true })

			if (!report) {
				return res.status(404).json({
					success: false,
					message: 'Report not found',
				})
			}

			res.json({ success: true, report })
		} catch (err) {
			console.error('Error updating report status:', err)
			res.status(500).json({
				success: false,
				message: err.message,
			})
		}
	},
	getReportsByUserId: async (req, res) => {
		try {
			const reports = await Report.find({ reportedUser: req.params.userId })
			res.json({ success: true, reports })
		} catch (err) {
			res.status(500).json({
				success: false,
				message: err.message,
			})
		}
	},
	// Update an entire report
	updateReport: async (req, res) => {
		try {
			const updates = req.body
			const report = await Report.findByIdAndUpdate(req.params.id, updates, {
				new: true,
				runValidators: true,
			})

			if (!report) {
				return res.status(404).json({
					success: false,
					message: 'Report not found',
				})
			}

			res.status(200).json({
				success: true,
				report,
			})
		} catch (err) {
			res.status(500).json({
				success: false,
				message: err.message,
			})
		}
	},
}

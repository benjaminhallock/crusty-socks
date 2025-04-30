import jwt from 'jsonwebtoken'
import User from '../models/user.js'

class AuthError extends Error {
  constructor(message) { super(message); this.name = 'AuthError' }
}

const authenticate = async (req, requireAdmin = false) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token?.trim()) throw new AuthError('Authorization header missing or malformed')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    
    if (!user) throw new AuthError('User not found')
    if (requireAdmin && !user.isAdmin) throw new AuthError('Access denied')
    
    Object.assign(req, { user, token: `Bearer ${token}`, _id: user._id })
    return true
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AuthError('Token has expired')
    if (err.name === 'JsonWebTokenError') throw new AuthError('Invalid token')
    throw err
  }
}

export const auth = async (req, res, next) => {
  try {
    await authenticate(req)
    next()
  } catch (err) {
    res.status(401).json({ success: false, message: err.message || 'Authentication failed' })
  }
}

export const isAdmin = async (req, res, next) => {
  try {
    await authenticate(req, true)
    next()
  } catch (err) {
    res.status(err instanceof AuthError && err.message === 'Access denied' ? 403 : 401)
       .json({ success: false, message: err.message || 'Authentication failed' })
  }
}

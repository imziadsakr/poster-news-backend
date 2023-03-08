import { Router } from 'express'
import authRoutes from './auth.route'
import postRoutes from './post.route'
import commentRoutes from './comment.route'

export default ([] as Router[]).concat(
  authRoutes,
  postRoutes,
  commentRoutes
)

import express from 'express'
import {
  addComment,
  addCommentReply,
  deleteComment,
  getCommentsFromPost
} from '../controllers/comment.controller'

const router = express.Router()

router.route('/addComment/:postId').post(addComment)

router
  .route('/addCommentReply/:postId/:commentId')
  .post(addCommentReply)

router.route('/getCommentsFromPost/:postId').get(getCommentsFromPost)

router.route('/deleteComment/:commentId').delete(deleteComment)

export default router

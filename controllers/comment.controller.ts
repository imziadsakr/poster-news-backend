import { Request } from 'express'
import { Comment, User } from '../models/'
import { IResponse } from '../Types'
import { statusCodes } from '../constants/statusCodes'

export const addCommentReply = async (
  req: Request,
  res: IResponse
) => {
  const { postId, commentId } = req.params
  const { userId, text } = req.body

  const findUser = await User.findById(userId)
  if (!findUser)
    return res.sendResponse(
      null,
      { message: 'User not found!' },
      statusCodes.NOT_FOUND
    )

  const newComment = new Comment({
    user: userId,
    post: postId,
    text,
    replyTo: commentId,
    createdAt: new Date()
  })
  await newComment.save()

  await Comment.findByIdAndUpdate(commentId, {
    $push: {
      replies: newComment._id
    }
  })
  findUser.balance = Number((findUser.balance - 0.01).toFixed(2))
  await findUser.save()

  res.sendResponse(
    {
      message: 'Successfully added reply!'
    },
    null,
    statusCodes.OK
  )
}

export const addComment = async (req: Request, res: IResponse) => {
  const { postId } = req.params
  const { userId, text } = req.body

  const findUser = await User.findById(userId)
  if (!findUser)
    return res.sendResponse(
      null,
      { message: 'User not found!' },
      statusCodes.NOT_FOUND
    )

  const newComment = new Comment({
    user: userId,
    post: postId,
    text,
    createdAt: new Date()
  })
  await newComment.save()
  findUser.balance = Number((findUser.balance - 0.01).toFixed(2))
  await findUser.save()
  res.sendResponse(
    {
      message: 'Successfully added comment'
    },
    null,
    statusCodes.OK
  )
}

export const getCommentsFromPost = async (
  req: Request,
  res: IResponse
) => {
  const { postId } = req.params

  const comments = await Comment.find({
    post: postId,
    replyTo: { $exists: false }
  })
    .populate('user post replies')
    .populate({
      path: 'replies',
      model: 'Comments',
      populate: [
        {
          path: 'user',
          model: 'Users'
        },
        {
          path: 'post',
          model: 'Posts'
        }
      ]
    })
    .sort('-createdAt')
    .lean()

  res.sendResponse(comments, null, statusCodes.OK)
}

export const deleteComment = async (req: Request, res: IResponse) => {
  const { commentId } = req.params

  const findComment = await Comment.findById(commentId)

  if (!findComment)
    return res.sendResponse(
      null,
      {
        message: 'Comment not found!'
      },
      statusCodes.NOT_FOUND
    )

  await Comment.findByIdAndDelete(commentId)
    .then(async () => {
      //remove id from parent if reply
      if (findComment.replyTo) {
        await Comment.findByIdAndUpdate(findComment.replyTo, {
          $pull: {
            replies: commentId
          }
        })
      }
      //remove all replies if parent
      else if (
        findComment.replies &&
        findComment.replies.length > 0
      ) {
        await Comment.deleteMany({
          _id: { $in: findComment.replies }
        })
      }
      res.sendResponse(
        {
          message: 'Successfully deleted!'
        },
        null,
        statusCodes.OK
      )
    })
    .catch(e =>
      res.sendResponse(null, e.message, statusCodes.BAD_REQUEST)
    )
}

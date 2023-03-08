import { Schema, model } from 'mongoose'

export interface CommentInterface {
  user: {
    type: Schema.Types.ObjectId
    ref: 'Users'
  }
  post: {
    type: Schema.Types.ObjectId
    ref: 'Posts'
  }
  text: string
  createdAt?: Date
  replyTo?: {
    type: Schema.Types.ObjectId
    ref: 'Comments'
  }
  replies?: {
    type: Schema.Types.ObjectId
    ref: 'Comments'
  }[]
}

const CommentSchema = new Schema<CommentInterface>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Posts'
  },
  text: String,
  createdAt: Date,
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Comments'
  },
  replies: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comments'
    }
  ]
})

const Comment = model<CommentInterface>('Comment', CommentSchema)

export { Comment }

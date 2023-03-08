import {
  Schema,
  model,
  Query,
  Document,
  QueryOptions
} from 'mongoose'

interface IPostQueryOptions extends QueryOptions {
  autoPopulateReplies?: boolean
}
export interface PostInterface {
  userId: {
    type: Schema.Types.ObjectId
    ref: 'User'
  }
  title?: string
  text?: string
  images?: string[]
  totalReplies?: number
  repliedTo?: {
    type: Schema.Types.ObjectId
    ref: 'Post'
  }
  replies?: {
    type: Schema.Types.ObjectId
    ref: 'Post'
  }[]
  upvotes?: {
    type: Schema.Types.ObjectId
    ref: 'User'
  }[]
  downvotes?: {
    type: Schema.Types.ObjectId
    ref: 'User'
  }[]
  totalVotes?: number
  preview?: {
    url: string
    favicons?: string[]
    siteName?: string
    images?: string[]
    title?: string
    description?: string
    youtubeId?: string
  }
  createdAt?: Date
  updatedAt?: Date
  // these fields are used by/for post ranking
  reputation: number
  lastUpvotesWeight: number
  lastDownvotesWeight: number
}

const PostSchema = new Schema<PostInterface>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  title: String,
  text: String,
  images: [String],
  totalReplies: Number,
  repliedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  replies: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    }
  ],
  upvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  downvotes: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  totalVotes: {
    type: Number,
    default: 0
  },
  preview: {
    url: String,
    favicons: [String],
    siteName: String,
    images: [String],
    title: String,
    description: String,
    youtubeId: String
  },
  createdAt: Date,
  updatedAt: Date,
  // these fields are used by/for post ranking
  reputation: { type: Schema.Types.Number, default: 0 },
  lastUpvotesWeight: { type: Schema.Types.Number, default: 0 },
  lastDownvotesWeight: { type: Schema.Types.Number, default: 0 }
})

function autoPopulateReplies(
  this: Query<any, Document>,
  next: () => void
) {
  const options = this.getOptions()
  this.populate([
    {
      path: 'replies',
      options
    },
    {
      path: 'userId',
      select: '_id username displayName reputation avatar',
      options
    }
  ])
  next()
}

PostSchema.pre<Query<any, Document, {}, IPostQueryOptions>>(
  'find',
  function (
    this: Query<any, Document, {}, IPostQueryOptions>,
    next: () => void
  ) {
    if (this.getOptions().autoPopulateReplies) {
      autoPopulateReplies.call(this, next)
    } else {
      next()
    }
  }
)

const Post = model<PostInterface>('Post', PostSchema)

export { Post }

import { Request } from 'express'
import { unlink } from 'fs'
import { getLinkPreview } from 'link-preview-js'
import mongoose from 'mongoose'
import dns from 'node:dns'
import { statusCodes } from '../constants/statusCodes'
import { Post, PostInterface, User } from '../models/'
import { IResponse } from '../Types'
import { ExpressExtends } from '../Types/interfaces'
import { Storage } from '@google-cloud/storage'
import dotenv from "dotenv";
dotenv.config();

const storage = new Storage({
  projectId : process.env.GCOULD_PROJECT_ID,
  keyFilename:`authKey/service_account_key.json`,
})

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET || "");

export const uploadToBucket = async (req: Request, res: IResponse) => {
  try {
      return res.status(200).json({
        url : req?.file?.filename || ""
      })
  } catch(err : any)  {
    console.log(err)
  }
}

export const removeFromBucket = async (req: Request, res: IResponse) => {
  try {
    const { filename } = req.body

    const file = bucket.file(`${filename}`);

    await file.delete()

    return res.status(200).json({
      message : 'success'
    })
  } catch(err: any) {
    console.log(err)
  }
}

export const createPost = async (req: Request, res: IResponse) => {
  const { userId, text, title, preview, images } = req.body
  const { io } = req.app as ExpressExtends


  const data: Partial<PostInterface> = {
    userId,
    title,
    createdAt: new Date()
  }

  if (preview && preview === 'true') {
    data['preview'] = {
      favicons: req.body.preview_favicons
        ? req.body.preview_favicons.split(',')
        : undefined,
      description: req.body.preview_description,
      images: req.body.preview_images
        ? req.body.preview_images.split(',')
        : undefined,
      siteName: req.body.preview_siteName,
      title: req.body.preview_title,
      url: req.body.preview_url,
      youtubeId: req.body.preview_youtubeId
    }
  }
  if (text) {
    data['text'] = text
  }
  if (req.files && req.files.length > 0 && Array.isArray(req.files)) {
    let tempFilePath: string[] = []

    for (let i = 0; i < req.files.length; i++) {
      tempFilePath.push(
        req.protocol +
          '://' +
          req.headers.host +
          '/images/' +
          req.files[i].filename
      )
    }

    data['images'] = tempFilePath
  }
  if(images && images.length > 0 && Array.isArray(images)){
    let tempFilePath: string[] = []
    for (let i = 0; i < images.length; i++) {
      tempFilePath.push(`https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${images[i]}`)
    }

    data['images'] = tempFilePath
  }
  const post = new Post(data)
  try {
    const userData = await User.findById(userId).select(
      'username displayName balance reputation avatar createdAt'
    )

    post.reputation = userData?.reputation || 0 // initial post reputation
    await post.save()

    io?.emit('NEW_POST', {
      user: userData,
      postId: post._id,
      title: post.title
    })

    res.sendResponse(post, null, statusCodes.OK)
  } catch (error: any) {
    res.sendResponse(
      null,
      { message: error.message },
      statusCodes.BAD_REQUEST
    )
  }
}

export const createPostReply = async (
  req: Request,
  res: IResponse
) => {
  const { userId, text, preview, images } = req.body
  const { postId } = req.params
  const { io } = req.app as ExpressExtends

  if (!postId)
    return res.sendResponse(
      null,
      { message: 'Wrong post id!' },
      statusCodes.BAD_REQUEST
    )

  const data: PostInterface = {
    userId,
    repliedTo: postId as any,
    createdAt: new Date(),
    reputation: 0,
    lastUpvotesWeight: 0,
    lastDownvotesWeight: 0
  }

  if (preview && preview === 'true') {
    data['preview'] = {
      favicons: req.body.preview_favicons
        ? req.body.preview_favicons.split(',')
        : undefined,
      description: req.body.preview_description,
      images: req.body.preview_images
        ? req.body.preview_images.split(',')
        : undefined,
      siteName: req.body.preview_siteName,
      title: req.body.preview_title,
      url: req.body.preview_url,
      youtubeId: req.body.preview_youtubeId
    }
  }
  if (text) {
    data['text'] = text
  }
  if (req.files && req.files.length > 0 && Array.isArray(req.files)) {
    let tempFilePath: string[] = []

    for (let i = 0; i < req.files.length; i++) {
      tempFilePath.push(
        req.protocol +
          '://' +
          req.headers.host +
          '/images/' +
          req.files[i].filename
      )
    }

    data['images'] = tempFilePath
  }
  if(images && images.length > 0 && Array.isArray(images)){
    let tempFilePath: string[] = []
    for (let i = 0; i < images.length; i++) {
      tempFilePath.push(`https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${images[i]}`)
    }

    data['images'] = tempFilePath
  }
  const post = new Post(data)
  try {
    await post.save()

    await Post.findByIdAndUpdate(postId, {
      $addToSet: { replies: post._id }
    })

    const userData = await User.findById(userId).select(
      'username displayName balance reputation avatar createdAt'
    )

    io?.emit('NEW_POST', {
      user: userData,
      postId: post._id,
      title: post.title
    })

    res.sendResponse(null, null, statusCodes.OK)
  } catch (error: any) {
    res.sendResponse(
      null,
      { message: error.message },
      statusCodes.BAD_REQUEST
    )
  }
}

export const editPost = async (req: Request, res: IResponse) => {
  const { id } = req.params
  const { text, title, preview, prevImages, images } = req.body

  const foundPost = await Post.findById(id)

  if (!foundPost)
    return res.sendResponse(
      null,
      {
        message: 'Post not found!'
      },
      statusCodes.NOT_FOUND
    )

  foundPost.title = title
  foundPost.updatedAt = new Date()

  if (preview && preview === 'true') {
    foundPost.preview = {
      favicons: req.body.preview_favicons
        ? req.body.preview_favicons.split(',')
        : undefined,
      description: req.body.preview_description,
      images: req.body.preview_images
        ? req.body.preview_images.split(',')
        : undefined,
      siteName: req.body.preview_siteName,
      title: req.body.preview_title,
      url: req.body.preview_url,
      youtubeId: req.body.preview_youtubeId
    }
  } else if (foundPost.preview && foundPost.preview.url && !preview) {
    foundPost.preview = undefined
  }

  if (text) {
    foundPost.text = text
  }

  let newImages: string[] = []
  if (req.files && req.files.length > 0 && Array.isArray(req.files)) {
    let tempFilePath: string[] = []

    for (let i = 0; i < req.files.length; i++) {
      tempFilePath.push(
        req.protocol +
          '://' +
          req.headers.host +
          '/images/' +
          req.files[i].filename
      )
    }

    newImages = tempFilePath
  }
  if(images && images.length > 0 && Array.isArray(images)){
    let tempFilePath: string[] = []
    for (let i = 0; i < images.length; i++) {
      tempFilePath.push(`https://storage.googleapis.com/${process.env.GCLOUD_STORAGE_BUCKET}/${images[i]}`)
    }

    newImages = tempFilePath
  }
  const tempPrevImages = prevImages ? prevImages.split(',') : []

  if (foundPost.images) {
    const imagesToDelete: string[] = foundPost.images.filter(
      (image: string) => !tempPrevImages.includes(image)
    )
    imagesToDelete.forEach((imageToDelete: string) => {
      const filename: string = imageToDelete.split('/').pop()! // get the filename from the URL
      // const path: string = `./public/images/${filename}` // build the path to the file
      const path: string = `/medias/${filename}` // build the path to the file

      // unlink(path, (error: NodeJS.ErrnoException | null) => {
      //   if (error) {
      //   } else {
      //   }
      // })

      const file = bucket.file(`${path}`);

      file.delete()
    })

  }

  foundPost.images = [...tempPrevImages, ...newImages]

  // const post = new Post(data)
  try {
    await foundPost.save()
    res.sendResponse(null, null, statusCodes.OK)
  } catch (error: any) {
    res.sendResponse(
      null,
      { message: error.message },
      statusCodes.BAD_REQUEST
    )
  }
}

export const deletePost = async (req: Request, res: IResponse) => {
  const { id } = req.params

  const foundPost = await Post.findById(id)
  if (foundPost) {
    const nestedReplies = await Post.aggregate([
      {
        $match: {
          _id: foundPost._id
        }
      },
      {
        $graphLookup: {
          from: 'posts',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'repliedTo',
          as: 'replies',
          depthField: 'depth'
        }
      }
    ])

    const replies =
      nestedReplies && nestedReplies[0] && nestedReplies[0].replies
        ? nestedReplies[0].replies
        : []

    Post.findByIdAndDelete(id)
      .then(async data => {
        if (!data) throw Error('Post not found!')

        const repliedTo = data.repliedTo

        if (repliedTo) {
          await Post.findByIdAndUpdate(repliedTo, {
            $pull: { replies: data._id }
          })
        }

        //delete all parent and nested images
        let imagesToDelete = data.images ? data.images : []
        for (let reply of replies) {
          if (reply.images && reply.images.length > 0) {
            imagesToDelete = [...imagesToDelete, ...reply.images]
          }
        }
        imagesToDelete &&
          imagesToDelete.forEach((imageToDelete: string) => {
            const filename: string = imageToDelete.split('/').pop()!
            const path: string = `./public/images/${filename}`

            unlink(path, (error: NodeJS.ErrnoException | null) => {
              if (error) {
                console.error(
                  `Failed to delete ${path}: ${error.message}`
                )
              } else {
                console.log(`Deleted ${path}`)
              }
            })
          })

        //deleting all replies
        for (let reply of replies) {
          await Post.findByIdAndDelete(reply._id)
        }

        res.sendResponse(null, null, statusCodes.NO_CONTENT)
      })
      .catch(e =>
        res.sendResponse(
          null,
          {
            message: e.message
          },
          statusCodes.NOT_FOUND
        )
      )
  } else {
    res.sendResponse(
      null,
      {
        message: 'Post not found!'
      },
      statusCodes.NOT_FOUND
    )
  }
}

export const getExplorePosts = async (
  req: Request,
  res: IResponse
) => {
  const { per_page, page } = req.query

  let pipeline: mongoose.PipelineStage[] = [
    {
      $sort: {
        createdAt: -1
      }
    }
  ]

  if (per_page && page) {
    pipeline.push({
      $skip: (Number(page) - 1) * Number(per_page)
    })
    pipeline.push({
      $limit: Number(per_page)
    })
  }

  pipeline = [
    ...pipeline,
    ...[
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId']
                }
              }
            },
            {
              $project: {
                _id: 1,
                username: 1,
                displayName: 1,
                reputation: 1,
                avatar: 1
              }
            }
          ],
          as: 'userId'
        }
      },
      {
        $unwind: {
          path: '$userId'
        }
      },
      {
        $lookup: {
          from: 'posts',
          let: { repliedTo: '$repliedTo' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$repliedTo' }]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                let: { userId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $toObjectId: '$$userId' }]
                      }
                    }
                  },
                  {
                    $project: {
                      username: 1,
                      displayName: 1,
                      reputation: 1,
                      balance: 1,
                      avatar: 1
                    }
                  }
                ],

                as: 'userId'
              }
            },
            {
              $unwind: {
                path: '$userId'
              }
            },
            {
              $project: {
                _id: 1,
                text: 1,
                title: 1,
                images: 1,
                repliedTo: 1,
                replies: 1,
                userId: 1,
                createdAt: 1,
                upvotes: 1,
                downvotes: 1,
                totalVotes: 1,
                preview: 1
              }
            }
          ],
          as: 'repliedTo'
        }
      },
      {
        $unwind: {
          path: '$repliedTo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          title: 1,
          text: 1,
          images: 1,
          createdAt: 1,
          upvotes: 1,
          downvotes: 1,
          totalVotes: 1,
          preview: 1,
          replies: 1,
          repliedTo: 1
        }
      }
    ]
  ]

  const posts = await Post.aggregate(pipeline)
  res.sendResponse(posts, null, statusCodes.OK)
}

export const getTrendingPosts = async (
  req: Request,
  res: IResponse
) => {
  const { per_page, page } = req.query

  const sortMap = new Map()
  sortMap.set('reputation', -1)
  sortMap.set('totalVotes', -1)
  let pipeline: mongoose.PipelineStage[] = [
    {
      $sort: sortMap as any
    }
  ]

  if (per_page && page) {
    pipeline.push({
      $skip: (Number(page) - 1) * Number(per_page)
    })
    pipeline.push({
      $limit: Number(per_page)
    })
  }

  pipeline = [
    ...pipeline,
    ...[
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId']
                }
              }
            },
            {
              $project: {
                _id: 1,
                username: 1,
                displayName: 1,
                reputation: 1,
                avatar: 1
              }
            }
          ],
          as: 'userId'
        }
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'posts',
          let: { repliedTo: '$repliedTo' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$repliedTo' }]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                let: { userId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $toObjectId: '$$userId' }]
                      }
                    }
                  },
                  {
                    $project: {
                      username: 1,
                      displayName: 1,
                      reputation: 1,
                      balance: 1,
                      avatar: 1
                    }
                  }
                ],

                as: 'userId'
              }
            },
            {
              $unwind: {
                path: '$userId'
              }
            },
            {
              $project: {
                _id: 1,
                text: 1,
                title: 1,
                images: 1,
                repliedTo: 1,
                replies: 1,
                userId: 1,
                createdAt: 1,
                upvotes: 1,
                downvotes: 1,
                totalVotes: 1,
                preview: 1
              }
            }
          ],
          as: 'repliedTo'
        }
      },
      {
        $unwind: {
          path: '$repliedTo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          title: 1,
          text: 1,
          images: 1,
          createdAt: 1,
          upvotes: 1,
          downvotes: 1,
          totalVotes: 1,
          preview: 1,
          replies: 1,
          repliedTo: 1,
          reputation: 1
        }
      }
    ]
  ]
  const posts = await Post.aggregate(pipeline)
  res.sendResponse(posts, null, statusCodes.OK)
}

export const getLinkDetails = async (
  req: Request,
  res: IResponse
) => {
  const { url } = req.params

  if (!url)
    return res.sendResponse(
      null,
      { message: 'Url required!' },
      statusCodes.BAD_REQUEST
    )

  getLinkPreview(url, {
    followRedirects: `manual`,
    handleRedirects: (baseURL: string, forwardedURL: string) => {
      const urlObj = new URL(baseURL)
      const forwardedURLObj = new URL(forwardedURL)
      if (
        forwardedURLObj.hostname === urlObj.hostname ||
        forwardedURLObj.hostname === 'www.' + urlObj.hostname ||
        'www.' + forwardedURLObj.hostname === urlObj.hostname
      ) {
        return true
      } else {
        return false
      }
    },
    resolveDNSHost: async (url: string) => {
      return new Promise((resolve, reject) => {
        const hostname = new URL(url).hostname
        dns.lookup(hostname, (err, address, family) => {
          if (err) {
            reject(err)
            return
          }

          resolve(address) // if address resolves to localhost or '127.0.0.1' library will throw an error
        })
      })
    }
  })
    .then(data => res.sendResponse(data, null, statusCodes.OK))
    .catch(e => {
      res.sendResponse(
        null,
        { message: e.message },
        statusCodes.BAD_REQUEST
      )
      // will throw a detected redirection to localhost
    })
}

export const upvotePost = async (req: Request, res: IResponse) => {
  const { id } = req.params

  const { userId } = req.body

  const findPost = await Post.findOne({
    _id: id
  })

  if (!findPost)
    return res.sendResponse(
      null,
      { message: 'Post not found!' },
      statusCodes.NOT_FOUND
    )

  const findUser = await User.findById(userId)

  if (!findUser)
    return res.sendResponse(
      null,
      { message: 'User not found!' },
      statusCodes.NOT_FOUND
    )

  const tempUpvotes =
    findPost && findPost.upvotes
      ? findPost.upvotes.map(item => item + '')
      : []

  const tempDownvotes =
    findPost && findPost.downvotes
      ? findPost.downvotes.map(item => item + '')
      : []

  let hasDownvote = false
  let downvotes = [...tempDownvotes]
  if (downvotes && downvotes.includes(userId)) {
    hasDownvote = true
    downvotes.splice(
      downvotes.findIndex(value => value + '' === userId + ''),
      1
    )
  }

  let upvotes = [...tempUpvotes]
  upvotes.push(userId)

  const updateQuery = {
    upvotes: [...upvotes],
    downvotes: [...downvotes],
    totalVotes: findPost.totalVotes
      ? hasDownvote
        ? findPost.totalVotes + 2
        : findPost.totalVotes + 1
      : 1,
    lastUpvotesWeight:
      (findPost.lastUpvotesWeight || 0) + findUser.reputation,
    lastDownvotesWeight: hasDownvote
      ? (findPost.lastDownvotesWeight || 0) - findUser.reputation
      : findPost.lastDownvotesWeight || 0
  }

  const updatedPost = await Post.findByIdAndUpdate(id, updateQuery, {
    new: true
  })

  findUser.balance = Number((findUser.balance - 0.01).toFixed(2))
  findUser.save()

  res.sendResponse(updatedPost, null, statusCodes.OK)
}

export const downvotePost = async (req: Request, res: IResponse) => {
  const { id } = req.params

  const { userId } = req.body

  const findPost = await Post.findOne({
    _id: id
  }).lean()

  if (!findPost)
    return res.sendResponse(
      null,
      { message: 'Post not found!' },
      statusCodes.NOT_FOUND
    )

  const findUser = await User.findById(userId)
  if (!findUser)
    return res.sendResponse(
      null,
      { message: 'User not found!' },
      statusCodes.NOT_FOUND
    )

  const tempUpvotes =
    findPost && findPost.upvotes
      ? findPost.upvotes.map(item => item + '')
      : []

  const tempDownvotes =
    findPost && findPost.downvotes
      ? findPost.downvotes.map(item => item + '')
      : []

  let hasUpvote = false

  const upvotes = [...tempUpvotes]
  if (upvotes && upvotes.includes(userId)) {
    hasUpvote = true
    upvotes.splice(
      upvotes.findIndex(value => value + '' === userId + ''),
      1
    )
  }

  let downvotes = [...tempDownvotes]
  downvotes.push(userId)

  const updateQuery = {
    upvotes: [...upvotes],
    downvotes: [...downvotes],
    totalVotes: findPost.totalVotes
      ? hasUpvote
        ? findPost.totalVotes - 2
        : findPost.totalVotes - 1
      : -1,

    lastUpvotesWeight: hasUpvote
      ? (findPost.lastUpvotesWeight || 0) - findUser.reputation
      : findPost.lastUpvotesWeight || 0,
    lastDownvotesWeight:
      (findPost.lastDownvotesWeight || 0) + findUser.reputation
  }

  const updatedPost = await Post.findByIdAndUpdate(id, updateQuery, {
    new: true
  })

  findUser.balance = Number((findUser.balance - 0.01).toFixed(2))
  findUser.save()

  res.sendResponse(updatedPost, null, statusCodes.OK)
}

export const getSinglePost = async (req: Request, res: IResponse) => {
  const { id } = req.params

  let objId
  try {
    objId = new mongoose.Types.ObjectId(id)
  } catch (e) {
    return res.sendResponse(
      null,
      { message: 'Wrong post id!' },
      statusCodes.BAD_REQUEST
    )
  }

  const foundPost = await Post.findById(objId)

  if (foundPost) {
    let pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          _id: objId
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$userId']
                }
              }
            },
            {
              $project: {
                _id: 1,
                username: 1,
                displayName: 1,
                reputation: 1,
                avatar: 1
              }
            }
          ],
          as: 'userId'
        }
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true
        }
      }
    ]

    if (foundPost.repliedTo) {
      pipeline.push({
        $lookup: {
          from: 'posts',
          let: { repliedTo: '$repliedTo' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$repliedTo' }]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                let: { userId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$_id', { $toObjectId: '$$userId' }]
                      }
                    }
                  },
                  {
                    $project: {
                      username: 1,
                      displayName: 1,
                      reputation: 1,
                      balance: 1,
                      avatar: 1
                    }
                  }
                ],

                as: 'userId'
              }
            },
            {
              $unwind: {
                path: '$userId',
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                text: 1,
                title: 1,
                images: 1,
                repliedTo: 1,
                replies: 1,
                userId: 1,
                createdAt: 1,
                upvotes: 1,
                downvotes: 1,
                totalVotes: 1,
                preview: 1
              }
            }
          ],
          as: 'repliedTo'
        }
      })
      pipeline.push({
        $unwind: {
          path: '$repliedTo'
        }
      })
    }

    pipeline.push({
      $project: {
        _id: 1,
        userId: 1,
        title: 1,
        text: 1,
        images: 1,
        createdAt: 1,
        upvotes: 1,
        downvotes: 1,
        totalVotes: 1,
        replies: 1,
        repliedTo: 1,
        preview: 1
      }
    })

    const singlePost = await Post.aggregate(pipeline)

    if (!singlePost || (singlePost && singlePost.length <= 0))
      return res.sendResponse(
        null,
        { message: 'Post not found!' },
        statusCodes.NOT_FOUND
      )

    res.sendResponse(singlePost[0], null, statusCodes.OK)
  } else {
    return res.sendResponse(
      null,
      { message: 'Post not found!' },
      statusCodes.NOT_FOUND
    )
  }
}

export const getPostReplies = async (
  req: Request,
  res: IResponse
) => {
  const { id } = req.params

  let objId
  try {
    objId = new mongoose.Types.ObjectId(id)
  } catch (e) {
    return res.sendResponse(
      null,
      { message: 'Wrong post id!' },
      statusCodes.BAD_REQUEST
    )
  }

  const singlePost = await Post.find({
    _id: objId
  })
    .populate('repliedTo')
    .setOptions({
      autoPopulateReplies: true
    })

  if (!singlePost || (singlePost && singlePost.length <= 0))
    return res.sendResponse(
      null,
      { message: 'Post not found!' },
      statusCodes.NOT_FOUND
    )

  res.sendResponse(singlePost[0], null, statusCodes.OK)
}

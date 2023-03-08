import { Request } from 'express'
import { User } from '../models/'
import { IResponse } from '../Types'
import { statusCodes } from '../constants/statusCodes'
import { generateUsername } from 'unique-username-generator'
import { generateAvatar } from '../lib/generateAvatar'

export const RegisterUser = async (req: Request, res: IResponse) => {
  const { username, password } = req.body

  const findUser = await User.find({ username })
  if (findUser && findUser.length > 0) {
    return res.sendResponse(
      null,
      { message: 'Username already exists!' },
      statusCodes.BAD_REQUEST
    )
  }
  try {
    const usersArray = []
    const parentAvatar = await generateAvatar(username, true)
    const parentUser = new User({
      username,
      password: password,
      displayName: username,
      reputation: 5,
      balance: 100.0,
      avatar:
        req.protocol +
        '://' +
        req.headers.host +
        '/' +
        parentAvatar.imagePath,
      createdAt: new Date()
    })

    await parentUser.save()
    usersArray.push(parentUser)

    for (let i = 0; i < 3; i++) {
      const randomUsername = generateUsername('-', undefined, 12)
      const randomAvatar = await generateAvatar(randomUsername, true)

      const user = new User({
        username: username + '-' + randomUsername,
        password: password,
        displayName: randomUsername,
        avatar:
          req.protocol +
          '://' +
          req.headers.host +
          '/' +
          randomAvatar.imagePath,
        reputation: 1,
        parent: parentUser._id,
        balance: 100.0,
        createdAt: new Date()
      })
      await user.save()
      usersArray.push(user)
    }

    res.sendResponse(usersArray, null, statusCodes.OK)
  } catch (error: any) {
    res.sendResponse(
      null,
      { message: error.message },
      statusCodes.BAD_REQUEST
    )
  }
}

export const LoginUser = async (req: Request, res: IResponse) => {
  const { username, password } = req.body

  try {
    const user = await User.findOne({ username })

    if (!user) {
      return res.sendResponse(
        null,
        { message: 'Invalid username or password / Not Found User' },
        statusCodes.UNAUTHORIZED
      )
    }
    user.comparePassword(password, async function (err, isMatch) {
      if (err) {
        return res.sendResponse(
          null,
          {
            message: 'Invalid username or password / Not Found User'
          },
          statusCodes.INTERNAL_SERVER_ERROR
        )
      }
      if (isMatch) {
        const userId = user.parent ? user.parent : user._id
        const userList = await User.find({
          $or: [
            {
              _id: userId
            },
            {
              parent: userId
            }
          ]
        })
        res.sendResponse(userList, null, statusCodes.OK)
      } else {
        return res.sendResponse(
          null,
          {
            message: 'Invalid username or password / Not Found User'
          },
          statusCodes.UNAUTHORIZED
        )
      }
    })
  } catch (error: any) {
    return res.sendResponse(
      null,
      { message: error.message },
      statusCodes.INTERNAL_SERVER_ERROR
    )
  }
}

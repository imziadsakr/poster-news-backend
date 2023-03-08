import { Schema, model, Types } from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser {
  username: string
  password: string
  displayName: string
  balance: number
  reputation: number
  parent: typeof Types.ObjectId
  avatar?: string
  createdAt?: Date
}

export interface UserInterface extends IUser {
  comparePassword: (
    plaintextPassword: string,
    callback: (err: any, isMatch: boolean) => void
  ) => void
}

const UserSchema = new Schema<UserInterface>({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  displayName: { type: String },
  avatar: { type: String },
  reputation: { type: Number },
  balance: { type: Number },
  parent: { type: Types.ObjectId, ref: 'User' },
  createdAt: Date
})

UserSchema.pre<UserInterface>('save', function (next) {
  const user: UserInterface = this
  const saltRounds = 8

  //ignore for isNew property of mongoose
  // @ts-ignore
  if (!user.password || !this.isNew) return next()

  bcrypt.hash(user.password, saltRounds, function (err, hash) {
    if (err) {
      return next(err)
    }
    user.password = hash
    next()
  })
})

// @ts-ignore
UserSchema.methods.comparePassword = function (
  plaintextPassword: string,
  callback: (err: any, isMatch: boolean) => void
) {
  bcrypt.compare(
    plaintextPassword,
    this.password,
    function (err, isMatch) {
      if (err) {
        return callback(err, isMatch)
      }
      callback(null, isMatch)
    }
  )
}

const User = model<UserInterface>('User', UserSchema)

export { User }

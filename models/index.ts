const mongoose = require('mongoose')

export * from './user.model'
export * from './post.model'
export * from './comment.model'

export const connectDatabase = () => {
  mongoose
    .connect(process.env.MONGO_DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      return console.log(`DATABASE CONNECTION SUCCESSFUL !`)
    })
    .catch((error: Error) => {
      console.log('Error connecting to database: ', error.message)
      return process.exit(1)
    })
}

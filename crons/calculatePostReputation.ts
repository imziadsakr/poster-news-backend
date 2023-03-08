const cron = require('node-cron')
import { Post } from '../models'

// run every 10 mins
cron.schedule('*/10 * * * *', async () => {
  console.log('[CRON]: Calculating post reputation')

  await Post.updateMany({}, [
    {
      $set: {
        // calculate reputation
        // [Formula] new reputation =
        //        (0.98 * old reputation) +
        //        (0.9 *
        //            (total weighted upvotes after last cron run - total weighted downvotes after last cron run)
        //        )
        reputation: {
          $add: [
            { $multiply: [0.98, '$reputation'] },
            {
              $multiply: [
                0.9,
                {
                  $subtract: [
                    '$lastUpvotesWeight',
                    '$lastDownvotesWeight'
                  ]
                }
              ]
            }
          ]
        },
        // set the votes weight back to 0
        lastUpvotesWeight: 0,
        lastDownvotesWeight: 0
      }
    }
  ])

  // for cases when - 0 after decimal and only positive numbers - set reputation to 0
  await Post.updateMany({ reputation: { $lt: 0.1 } }, [
    { $set: { reputation: 0 } }
  ])
})

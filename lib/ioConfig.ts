import { Server, Socket } from 'socket.io'

export default (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('a user connected')

    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })
}

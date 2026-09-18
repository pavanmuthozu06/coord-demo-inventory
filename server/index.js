import { createApp } from './app.js'

const port = Number(process.env.PORT) || 3737
const host = process.env.HOST || '127.0.0.1' // localhost only unless you say otherwise

const server = createApp().listen(port, host, () => {
  console.log(`Inventory dashboard → http://${host}:${port}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try:  PORT=${port + 1} npm start`)
    process.exit(1)
  }
  throw err
})

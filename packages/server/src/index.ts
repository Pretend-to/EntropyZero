import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'

const fastify = Fastify({
  logger: true,
})

// 注册插件
await fastify.register(cors, {
  origin: ['http://localhost:3000'],
})

await fastify.register(websocket)

// 健康检查
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// API 路由
fastify.get('/api/hello', async (request, reply) => {
  return { message: 'Hello from EntropyZero Server!' }
})

// WebSocket 连接
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message) => {
      connection.socket.send('Echo: ' + message)
    })
  })
})

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    console.log('🚀 EntropyZero Server running on http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
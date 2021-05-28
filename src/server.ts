import { AppDatabaseManager } from './DatabaseManager'
import ApolloServerManager from './ApolloServerManager'
import { ApolloServer } from 'apollo-server'

async function main () {
  const app = await createApp()
  const port = process.env.SERVER_PORT || 3100

  app.listen(port)

  console.log(`Listening on port http://localhost:${port}`)
}

async function createApp (): Promise<ApolloServer> {
  const serverManager = new ApolloServerManager(new AppDatabaseManager(), {
    introspection: !(process.env.NODE_ENV === 'production'),
    playground: !(process.env.NODE_ENV === 'production')
  })

  return await serverManager.start()
}

main()

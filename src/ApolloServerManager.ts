import { ApolloServer } from 'apollo-server'
import { GraphQLError, GraphQLFormattedError } from 'graphql'
import { ADatabaseManager } from './DatabaseManager'
import User from './datasource/User'
import schema from './graphql/schema'
import { DataSources } from 'apollo-server-core/dist/graphqlOptions'

class ApolloServerManager {
  dbManager: ADatabaseManager
  apolloOptions: Record<string, unknown>
  server: ApolloServer

  constructor (
    dbManager: ADatabaseManager,
    apolloOptions: Record<string, unknown> = {}
  ) {
    this.dbManager = dbManager
    this.apolloOptions = apolloOptions
  }

  async start (): Promise<ApolloServer> {
    const dataSources = await this.dataSources()
    this.server = new ApolloServer({
      schema,
      formatError: this.formatError,
      dataSources: dataSources,
      ...this.apolloOptions
    })
    return this.server
  }

  async stop (): Promise<void> {
    await this.server.stop()
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  async dataSources (): Promise<() => DataSources<object>> {
    const db = await this.dbManager.start()
    return () => ({
      users: new User(db.collection('users'))
    })
  }

  formatError (err: GraphQLError): GraphQLFormattedError {
    console.error('Error while running resolver', {
      error: err
    })

    // Hide all internals by default
    return new Error('Internal server error')
  }
}

export default ApolloServerManager

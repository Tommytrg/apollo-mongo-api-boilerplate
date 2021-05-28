import { createTestClient } from 'apollo-server-testing'
import ApolloServerManager from '../src/ApolloServerManager'
import options from './common'
import TestDatabaseManager from './TestDatabaseManager'

import { gql } from 'apollo-server'
import { ObjectId } from 'mongodb'
import { UserDbObject } from '../src/generated/types'

describe('user', function () {
  beforeAll(async function () {
    options.dbManager = new TestDatabaseManager()
    options.serverManager = new ApolloServerManager(options.dbManager)
    const server = await options.serverManager.start()
    options.testClient = createTestClient(server)
  })

  afterAll(async function () {
    await options.dbManager.stop()
    await options.serverManager.stop()
  })

  beforeEach(async function () {
    const collections = options.dbManager.db.collections
    for (const key in collections) {
      await options.dbManager.db.dropCollection(key)
    }
  })

  it('Add a valid user', async () => {
    // Preparation
    const user = { name: 'John' }
    const ADD_USER = gql`
      mutation addUser($name: String!) {
        addUser(name: $name) {
          _id
          name
        }
      }
    `

    // GraphQL
    const { data } = await options.testClient.mutate({
      mutation: ADD_USER,
      variables: {
        ...user
      }
    })
    expect(ObjectId.isValid(data.addUser._id)).toBe(true)
    expect(data.addUser.name).toBe(user.name)

    // Database
    const dbUser = await options.dbManager.db
      .collection<UserDbObject>('users')
      .findOne({ name: user.name })
    expect(ObjectId.isValid(dbUser._id)).toBe(true)
    expect(dbUser.name).toBe(user.name)
  })

  it('get a valid user', async () => {
    // Preparation (insert a new user in DB)
    const result = await options.dbManager.db
      .collection<UserDbObject>('users')
      .insertOne({ name: 'John' })
    const dbUser = await options.dbManager.db
      .collection<UserDbObject>('users')
      .findOne({ _id: result.insertedId })
    const GET_USER = gql`
      query User($name: String) {
        user(name: $name) {
          _id
          name
        }
      }
    `

    // GraphQL
    const {
      data: { user }
    } = await options.testClient.query({
      query: GET_USER,
      variables: {
        name: 'John'
      }
    })
    expect(ObjectId.isValid(user._id)).toBe(true)
    expect(user.name).toBe(dbUser.name)
  })
})

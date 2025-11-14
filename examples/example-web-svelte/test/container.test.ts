import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createContainer } from '@speajus/diblob'

import { exampleWebConfig, userGateway } from '../src/diblob/blobs.js'
import { registerExampleWebBlobs } from '../src/diblob/register.js'

test('registerExampleWebBlobs wires up config and user gateway', async () => {
  const container = createContainer()

  registerExampleWebBlobs(container, {
    apiBaseUrl: 'http://localhost:50051',
    visualizerEventsUrl: 'http://localhost:3001/events',
  })

  const config = await container.resolve(exampleWebConfig)
  assert.equal(config.apiBaseUrl, 'http://localhost:50051')

  const gateway = await container.resolve(userGateway)
  assert.ok(gateway, 'user gateway should resolve from container')
})


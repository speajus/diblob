import { type Container, Lifecycle } from '@speajus/diblob'
import { createPromiseClient, type PromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-web'

import { UserService } from '../grpc/user_pb.js'
import {
  avatarUrlProvider,
  exampleWebConfig,
  type ExampleWebConfig,
  type AvatarUrlProvider,
  type UserGateway,
  userGateway,
} from './blobs'

export const DEFAULT_CONFIG: ExampleWebConfig = {
  apiBaseUrl: 'http://localhost:50051',
  visualizerEventsUrl: 'http://localhost:3001/events',
}

class PlaceholderAvatarUrlProvider implements AvatarUrlProvider {
  avatarUrl(email: string): string {
    const seed = encodeURIComponent(email || 'anonymous-user')
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`
  }
}

class ConnectUserGateway implements UserGateway {
  private client: PromiseClient<typeof UserService>

  constructor(private readonly config: ExampleWebConfig) {
    const transport = createConnectTransport({
      baseUrl: config.apiBaseUrl,
    })
    this.client = createPromiseClient(UserService, transport)
  }

  async fetchUsers(params?: { limit?: number; offset?: number }) {
    const limit = params?.limit ?? 20
    const offset = params?.offset ?? 0

    const response = await this.client.listUsers({ limit, offset })

    return response.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt ? new Date(Number(user.createdAt)) : null,
    }))
  }
}

export function registerExampleWebBlobs(
  container: Container,
  overrides: Partial<ExampleWebConfig> = {},
): void {
  const config: ExampleWebConfig = {
    ...DEFAULT_CONFIG,
    ...overrides,
  }

  container.register(exampleWebConfig, () => config, {
    lifecycle: Lifecycle.Singleton,
  })

  container.register(avatarUrlProvider, PlaceholderAvatarUrlProvider, {
    lifecycle: Lifecycle.Singleton,
  })

  container.register(userGateway, ConnectUserGateway, exampleWebConfig, {
    lifecycle: Lifecycle.Singleton,
  })
}


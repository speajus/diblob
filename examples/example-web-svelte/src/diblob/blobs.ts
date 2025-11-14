import { createBlob } from '@speajus/diblob'

export interface ExampleWebConfig {
  apiBaseUrl: string
  visualizerEventsUrl: string
}

export interface UserViewModel {
  id: number
  name: string
  email: string
  createdAt: Date | null
}

export interface UserGateway {
  fetchUsers(params?: { limit?: number; offset?: number }): Promise<UserViewModel[]>
}

export interface AvatarUrlProvider {
  avatarUrl(email: string): string
}

export const exampleWebConfig = createBlob<ExampleWebConfig>('exampleWebConfig', {
  name: 'Example web client configuration',
  description: 'Base URLs for the gRPC API and diblob visualizer server',
})

export const userGateway = createBlob<UserGateway>('userGateway', {
  name: 'User gateway',
  description: 'Abstraction over the UserService gRPC client for the web UI',
})

export const avatarUrlProvider = createBlob<AvatarUrlProvider>('avatarUrlProvider', {
  name: 'Avatar URL provider',
  description: 'Generates stable avatar URLs for users in the UI',
})


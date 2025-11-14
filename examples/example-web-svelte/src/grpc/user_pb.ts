// Minimal subset of the generated types from user.proto needed by the web example.
// The full file lives in examples/example-grpc-server/src/generated/user_pb.ts.

import type { Message } from '@bufbuild/protobuf'
import type { GenFile, GenMessage, GenService } from '@bufbuild/protobuf/codegenv2'
import { fileDesc, messageDesc, serviceDesc } from '@bufbuild/protobuf/codegenv2'

export const file_user: GenFile = fileDesc(
  'Cgp1c2VyLnByb3RvEgR1c2VyIkMKBFVzZXISCgoCaWQYASABKAUSDAoEbmFtZRgCIAEoCRINCgVlbWFpbBgDIAEoCRISCgpjcmVhdGVkX2F0GAQgASgDIhwKDkdldFVzZXJSZXF1ZXN0EgoKAmlkGAEgASgFIisKD0dldFVzZXJSZXNwb25zZRIYCgR1c2VyGAEgASgLMgoudXNlci5Vc2VyIjAKEUNyZWF0ZVVzZXJSZXF1ZXN0EgwKBG5hbWUYASABKAkSDQoFZW1haWwYAiABKAkiLgoSQ3JlYXRlVXNlclJlc3BvbnNlEhgKBHVzZXIYASABKAsyCi51c2VyLlVzZXIiMQoQTGlzdFVzZXJzUmVxdWVzdBINCgVsaW1pdBgBIAEoBRIOCgZvZmZzZXQYAiABKAUiPQoRTGlzdFVzZXJzUmVzcG9uc2USGQoFdXNlcnMYASADKAsyCi51c2VyLlVzZXISDQoFdG90YWwYAiABKAUiPAoRVXBkYXRlVXNlclJlcXVlc3QSCgoCaWQYASABKAUSDAoEbmFtZRgCIAEoCRINCgVlbWFpbBgDIAEoCSIuChJVcGRhdGVVc2VyUmVzcG9uc2USGAoEdXNlchgBIAEoCzIKLnVzZXIuVXNlciIfChFEZWxldGVVc2VyUmVxdWVzdBIKCgJpZBgBIAEoBSIlChJEZWxldGVVc2VyUmVzcG9uc2USDwoHc3VjY2VzcxgBIAEoCDLGAgoLVXNlclNlcnZpY2USNgoHR2V0VXNlchIULnVzZXIuR2V0VXNlclJlcXVlc3QaFS51c2VyLkdldFVzZXJSZXNwb25zZRI/CgpDcmVhdGVVc2VyEhcudXNlci5DcmVhdGVVc2VyUmVxdWVzdBoYLnVzZXIuQ3JlYXRlVXNlclJlc3BvbnNlEjwKCUxpc3RVc2VycxIWLnVzZXIuTGlzdFVzZXJzUmVxdWVzdBoXLnVzZXIuTGlzdFVzZXJzUmVzcG9uc2USPwoKVXBkYXRlVXNlchIXLnVzZXIuVXBkYXRlVXNlclJlcXVlc3QaGC51c2VyLlVwZGF0ZVVzZXJSZXNwb25zZRI/CgpEZWxldGVVc2VyEhcudXNlci5EZWxldGVVc2VyUmVxdWVzdBoYLnVzZXIuRGVsZXRlVXNlclJlc3BvbnNlYgZwcm90bzM',
)

export type User = Message<'user.User'> & {
  id: number
  name: string
  email: string
  createdAt: bigint
}

export const UserSchema: GenMessage<User> = messageDesc(file_user, 0)

export type ListUsersRequest = Message<'user.ListUsersRequest'> & {
  limit: number
  offset: number
}

export const ListUsersRequestSchema: GenMessage<ListUsersRequest> = messageDesc(
  file_user,
  5,
)

export type ListUsersResponse = Message<'user.ListUsersResponse'> & {
  users: User[]
  total: number
}

export const ListUsersResponseSchema: GenMessage<ListUsersResponse> = messageDesc(
  file_user,
  6,
)

export const UserService: GenService<{
  listUsers: {
    methodKind: 'unary'
    input: typeof ListUsersRequestSchema
    output: typeof ListUsersResponseSchema
  }
}> = serviceDesc(file_user, 0)


<script lang="ts">
  import { useBlob } from '@speajus/diblob-svelte'

  import {
    avatarUrlProvider,
    userGateway,
    type AvatarUrlProvider,
    type UserGateway,
  } from '../diblob/blobs.js'

  const userGatewayRef = useBlob(userGateway) as UserGateway | Promise<UserGateway>
  const avatarProviderRef = useBlob(avatarUrlProvider) as
    | AvatarUrlProvider
    | Promise<AvatarUrlProvider>

  type UserListItem = {
    id: number
    name: string
    email: string
    avatarUrl: string
    createdAtLabel: string
  }

  let users = $state<UserListItem[]>([])
  let loading = $state(true)
  let errorMessage = $state<string | null>(null)

  const hasUsers = $derived(users.length > 0)

  $effect(async () => {
    loading = true
    errorMessage = null

    try {
      const [gateway, avatar] = await Promise.all([
        userGatewayRef,
        avatarProviderRef,
      ])

      const records = await gateway.fetchUsers({ limit: 25, offset: 0 })

      users = records.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: avatar.avatarUrl(u.email),
        createdAtLabel: u.createdAt
          ? new Date(Number(u.createdAt) * 1000).toLocaleString()
          : 'Unknown',
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errorMessage = `Unable to load users: ${message}`
    } finally {
      loading = false
    }
  })
</script>

<section class="user-list">
  <header>
    <h2>Users</h2>
    <p>Data is fetched from the example-gRPC server via Connect-ES.</p>
  </header>

  {#if loading}
    <p class="status">Loading users...</p>
  {:else if errorMessage}
    <p class="status error">{errorMessage}</p>
  {:else if hasUsers}
    <ul class="cards">
      {#each users as user}
        <li class="card">
          <img
            alt={`Avatar for ${user.name}`}
            class="avatar"
            src={user.avatarUrl}
          />
          <div class="details">
            <h3>{user.name}</h3>
            <p class="email">{user.email}</p>
            <p class="created">Joined: {user.createdAtLabel}</p>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="status">No users yet. Start the server and seed some data.</p>
  {/if}
</section>

<style>
  .user-list header {
    margin-bottom: 1rem;
  }

  .cards {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
    align-items: center;
  }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    background: #e5e7eb;
  }

  .details h3 {
    margin: 0 0 0.25rem;
  }

  .details .email {
    margin: 0;
    font-size: 0.9rem;
    color: #4b5563;
  }

  .details .created {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .status {
    margin-top: 1rem;
    color: #4b5563;
  }

  .status.error {
    color: #b91c1c;
  }
</style>


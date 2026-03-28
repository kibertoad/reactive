import { useService, getUserContract } from '@example/app-contract'
import { sendByContract } from '@lokalise/frontend-http-client'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { useEventBus } from '@reactive/core'

export default function UserDetail() {
  const { userId } = useParams({ strict: false }) as { userId: string }
  const httpClient = useService('httpClient')
  const eventBus = useEventBus()

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => sendByContract(httpClient, getUserContract, {
      pathParams: { userId },
    }),
  })

  function handleDeactivate() {
    eventBus.emit('users:deactivated', { userId })
  }

  if (isLoading) return <p>Loading user...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <h2>User: {user?.name}</h2>
      {user && (
        <dl>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Role</dt>
          <dd>{user.role}</dd>
        </dl>
      )}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/users">Back to Users</Link>
        <Link to="/billing">View Billing</Link>
        <button onClick={handleDeactivate}>Deactivate User</button>
      </div>
    </div>
  )
}

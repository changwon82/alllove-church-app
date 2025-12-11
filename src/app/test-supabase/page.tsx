// app/test-supabase/page.tsx
import { supabase } from '../../../lib/supabaseClient'

export default async function TestSupabasePage() {
  const { data, error } = await supabase
    .from('members')
    .select('id, name')
    .limit(10)

  if (error) {
    return <div>에러: {error.message}</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase 연결 테스트</h1>
      <ul>
        {data?.map((m) => (
          <li key={m.id}>{m.name}</li>
        ))}
      </ul>
    </div>
  )
}

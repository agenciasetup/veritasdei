import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Try exact match on reference field in catecismo table
    const { data, error } = await supabase
      .from('catecismo')
      .select('reference, text')
      .ilike('reference', `%${ref.replace('CIC § ', '').replace('CIC §', '').trim()}%`)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Catechism entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      reference: data[0].reference,
      text: data[0].text,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

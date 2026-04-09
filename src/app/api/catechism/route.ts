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

    // Extract paragraph number from references like "CIC § 1030", "CIC §1030", "§ 1030", "1030"
    const numberMatch = ref.match(/(\d+)/)
    if (!numberMatch) {
      return NextResponse.json({ error: 'Could not parse paragraph number' }, { status: 400 })
    }

    const paragraphNumber = parseInt(numberMatch[1], 10)

    const { data, error } = await supabase
      .from('catecismo')
      .select('paragraph, text, section')
      .eq('paragraph', paragraphNumber)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Catechism entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      reference: `CIC § ${data[0].paragraph}`,
      text: data[0].text,
      section: data[0].section,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

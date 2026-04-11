import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { flow_id, email, permission = 'view' } = body

    if (!flow_id || !email) {
      return NextResponse.json({ error: 'flow_id and email are required' }, { status: 400 })
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Verify user owns the flow
    const { data: flow } = await supabase
      .from('verbum_flows')
      .select('id, user_id, name')
      .eq('id', flow_id)
      .single()

    if (!flow || flow.user_id !== user.id) {
      return NextResponse.json({ error: 'Flow not found or unauthorized' }, { status: 403 })
    }

    // Check if already shared
    const { data: existing } = await supabase
      .from('verbum_flow_shares')
      .select('id')
      .eq('flow_id', flow_id)
      .eq('shared_with_email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already shared with this email' }, { status: 409 })
    }

    // Try to find user by email
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    // Create share
    const { data: share, error } = await supabase
      .from('verbum_flow_shares')
      .insert({
        flow_id,
        shared_by: user.id,
        shared_with_email: email.toLowerCase(),
        shared_with_user: targetProfile?.id || null,
        permission: permission === 'edit' ? 'edit' : 'view',
        accepted: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Share error:', error)
      return NextResponse.json({ error: 'Failed to create share' }, { status: 500 })
    }

    // Generic message to prevent email enumeration
    return NextResponse.json({
      success: true,
      share,
      message: 'Convite enviado com sucesso!',
    })
  } catch (error) {
    console.error('Share API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

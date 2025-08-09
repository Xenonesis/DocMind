import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Clean up documents with malformed timestamps
    const { data: documents, error: fetchError } = await supabaseServer
      .from('documents')
      .select('id, created_at, updated_at')

    if (fetchError) {
      console.error('Error fetching documents for cleanup:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    let cleanedCount = 0
    const now = new Date().toISOString()

    for (const doc of documents || []) {
      let needsUpdate = false
      const updates: any = {}

      // Check if timestamps are malformed (empty objects or invalid)
      if (!doc.created_at || doc.created_at === '{}' || typeof doc.created_at === 'object') {
        updates.created_at = now
        needsUpdate = true
      }

      if (!doc.updated_at || doc.updated_at === '{}' || typeof doc.updated_at === 'object') {
        updates.updated_at = now
        needsUpdate = true
      }

      if (needsUpdate) {
        const { error: updateError } = await supabaseServer
          .from('documents')
          .update(updates)
          .eq('id', doc.id)

        if (updateError) {
          console.error(`Error updating document ${doc.id}:`, updateError)
        } else {
          cleanedCount++
        }
      }
    }

    // Clean up ai_provider_settings with malformed timestamps
    const { data: settings, error: settingsError } = await supabaseServer
      .from('ai_provider_settings')
      .select('id, created_at, updated_at')

    if (!settingsError) {
      for (const setting of settings || []) {
        let needsUpdate = false
        const updates: any = {}

        if (!setting.created_at || setting.created_at === '{}' || typeof setting.created_at === 'object') {
          updates.created_at = now
          needsUpdate = true
        }

        if (!setting.updated_at || setting.updated_at === '{}' || typeof setting.updated_at === 'object') {
          updates.updated_at = now
          needsUpdate = true
        }

        if (needsUpdate) {
          const { error: updateError } = await supabaseServer
            .from('ai_provider_settings')
            .update(updates)
            .eq('id', setting.id)

          if (!updateError) {
            cleanedCount++
          }
        }
      }
    }

    // Clean up other tables as needed
    const tables = ['users', 'analyses', 'queries']
    for (const table of tables) {
      const { data: records, error } = await supabaseServer
        .from(table)
        .select('id, created_at, updated_at')

      if (!error && records) {
        for (const record of records) {
          let needsUpdate = false
          const updates: any = {}

          if (!record.created_at || record.created_at === '{}' || typeof record.created_at === 'object') {
            updates.created_at = now
            needsUpdate = true
          }

          if (!record.updated_at || record.updated_at === '{}' || typeof record.updated_at === 'object') {
            updates.updated_at = now
            needsUpdate = true
          }

          if (needsUpdate) {
            const { error: updateError } = await supabaseServer
              .from(table)
              .update(updates)
              .eq('id', record.id)

            if (!updateError) {
              cleanedCount++
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      message: `Database cleanup completed. Fixed ${cleanedCount} records with malformed timestamps.`,
      cleanedCount 
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Create tables if they don't exist
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- AI Provider Settings table
      CREATE TABLE IF NOT EXISTS ai_provider_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        api_key TEXT DEFAULT '',
        base_url TEXT DEFAULT '',
        model TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT FALSE,
        config TEXT DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Documents table
      CREATE TABLE IF NOT EXISTS documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size TEXT NOT NULL,
        status TEXT NOT NULL,
        content TEXT,
        metadata TEXT DEFAULT '{}',
        upload_date TIMESTAMPTZ DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        category TEXT,
        tags TEXT DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Analyses table
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence INTEGER NOT NULL,
        severity TEXT,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        documents TEXT DEFAULT '[]',
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Queries table
      CREATE TABLE IF NOT EXISTS queries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        query TEXT NOT NULL,
        status TEXT NOT NULL,
        response TEXT,
        results INTEGER,
        document_ids TEXT DEFAULT '[]',
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        metadata TEXT DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_ai_provider_settings_user_id ON ai_provider_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_analyses_document_id ON analyses(document_id);
      CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
      CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
      CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at);
    `

    // Check if tables exist by trying to query them
    const tables = ['users', 'ai_provider_settings', 'documents', 'analyses', 'queries']
    const existingTables: string[] = []
    const missingTables: string[] = []

    for (const table of tables) {
      try {
        const { error } = await supabaseServer.from(table).select('id').limit(1)
        if (error) {
          missingTables.push(table)
        } else {
          existingTables.push(table)
        }
      } catch (e) {
        missingTables.push(table)
      }
    }

    return NextResponse.json({ 
      message: `Database check completed. Found ${existingTables.length} existing tables, ${missingTables.length} missing tables.`,
      existingTables,
      missingTables,
      note: missingTables.length > 0 ? 'Please create the missing tables in your Supabase dashboard using the SQL editor.' : 'All tables exist.'
    })

  } catch (error) {
    console.error('Database init error:', error)
    return NextResponse.json({ error: 'Database initialization failed' }, { status: 500 })
  }
}
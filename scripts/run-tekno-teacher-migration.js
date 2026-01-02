/**
 * TeknoÖğretmen Migration Script
 * Supabase'e tabloları oluşturur
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🚀 TeknoÖğretmen migration başlatılıyor...\n')

  // SQL komutlarını ayrı ayrı çalıştır
  const queries = [
    // 1. Tablolar
    {
      name: 'tekno_teacher_sessions tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS tekno_teacher_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          subject_code VARCHAR(50),
          topic VARCHAR(255),
          total_questions INTEGER DEFAULT 0,
          correct_answers INTEGER DEFAULT 0,
          wrong_answers INTEGER DEFAULT 0,
          score DECIMAL(5,2),
          duration_seconds INTEGER,
          wrong_question_ids UUID[],
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'tekno_teacher_weaknesses tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS tekno_teacher_weaknesses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          subject_code VARCHAR(50) NOT NULL,
          topic VARCHAR(255) NOT NULL,
          sub_topic VARCHAR(255),
          wrong_count INTEGER DEFAULT 1,
          last_wrong_at TIMESTAMPTZ DEFAULT NOW(),
          improvement_score DECIMAL(5,2) DEFAULT 0,
          podcast_generated_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, subject_code, topic, sub_topic)
        );
      `
    },
    {
      name: 'tekno_teacher_feedback tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS tekno_teacher_feedback (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          session_id UUID,
          feedback_type VARCHAR(20) DEFAULT 'text',
          text_content TEXT,
          audio_url TEXT,
          audio_duration_seconds INTEGER,
          topic_context JSONB,
          prompt_used TEXT,
          is_premium BOOLEAN DEFAULT FALSE,
          credits_used INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'tekno_teacher_credits tablosu',
      sql: `
        CREATE TABLE IF NOT EXISTS tekno_teacher_credits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          daily_credits INTEGER DEFAULT 3,
          used_today INTEGER DEFAULT 0,
          total_used INTEGER DEFAULT 0,
          is_premium BOOLEAN DEFAULT FALSE,
          premium_until TIMESTAMPTZ,
          last_reset_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    // 2. Indexler
    {
      name: 'sessions indexleri',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tt_sessions_user_id ON tekno_teacher_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_tt_sessions_created_at ON tekno_teacher_sessions(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tt_sessions_subject ON tekno_teacher_sessions(subject_code);
      `
    },
    {
      name: 'weaknesses indexleri',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tt_weaknesses_user_id ON tekno_teacher_weaknesses(user_id);
        CREATE INDEX IF NOT EXISTS idx_tt_weaknesses_topic ON tekno_teacher_weaknesses(subject_code, topic);
        CREATE INDEX IF NOT EXISTS idx_tt_weaknesses_wrong_count ON tekno_teacher_weaknesses(wrong_count DESC);
      `
    },
    {
      name: 'feedback indexleri',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tt_feedback_user_id ON tekno_teacher_feedback(user_id);
        CREATE INDEX IF NOT EXISTS idx_tt_feedback_created_at ON tekno_teacher_feedback(created_at DESC);
      `
    },
    {
      name: 'credits indexleri',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tt_credits_user_id ON tekno_teacher_credits(user_id);
      `
    },
    // 3. RLS
    {
      name: 'RLS - sessions',
      sql: `
        ALTER TABLE tekno_teacher_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own sessions" ON tekno_teacher_sessions;
        CREATE POLICY "Users can view own sessions" ON tekno_teacher_sessions FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can insert own sessions" ON tekno_teacher_sessions;
        CREATE POLICY "Users can insert own sessions" ON tekno_teacher_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    },
    {
      name: 'RLS - weaknesses',
      sql: `
        ALTER TABLE tekno_teacher_weaknesses ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own weaknesses" ON tekno_teacher_weaknesses;
        CREATE POLICY "Users can view own weaknesses" ON tekno_teacher_weaknesses FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can manage own weaknesses" ON tekno_teacher_weaknesses;
        CREATE POLICY "Users can manage own weaknesses" ON tekno_teacher_weaknesses FOR ALL USING (auth.uid() = user_id);
      `
    },
    {
      name: 'RLS - feedback',
      sql: `
        ALTER TABLE tekno_teacher_feedback ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own feedback" ON tekno_teacher_feedback;
        CREATE POLICY "Users can view own feedback" ON tekno_teacher_feedback FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can insert own feedback" ON tekno_teacher_feedback;
        CREATE POLICY "Users can insert own feedback" ON tekno_teacher_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    },
    {
      name: 'RLS - credits',
      sql: `
        ALTER TABLE tekno_teacher_credits ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can view own credits" ON tekno_teacher_credits;
        CREATE POLICY "Users can view own credits" ON tekno_teacher_credits FOR SELECT USING (auth.uid() = user_id);
        DROP POLICY IF EXISTS "Users can update own credits" ON tekno_teacher_credits;
        CREATE POLICY "Users can update own credits" ON tekno_teacher_credits FOR UPDATE USING (auth.uid() = user_id);
      `
    },
    // 4. Fonksiyonlar
    {
      name: 'check_and_use_ai_credit fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION check_and_use_ai_credit(p_user_id UUID)
        RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, is_premium BOOLEAN) AS $$
        DECLARE
          v_credits tekno_teacher_credits%ROWTYPE;
        BEGIN
          INSERT INTO tekno_teacher_credits (user_id)
          VALUES (p_user_id)
          ON CONFLICT (user_id) DO NOTHING;
          
          SELECT * INTO v_credits FROM tekno_teacher_credits WHERE user_id = p_user_id;
          
          IF v_credits.last_reset_date < CURRENT_DATE THEN
            UPDATE tekno_teacher_credits 
            SET used_today = 0, last_reset_date = CURRENT_DATE, updated_at = NOW()
            WHERE user_id = p_user_id;
            v_credits.used_today := 0;
          END IF;
          
          IF v_credits.is_premium AND (v_credits.premium_until IS NULL OR v_credits.premium_until > NOW()) THEN
            UPDATE tekno_teacher_credits 
            SET used_today = used_today + 1, total_used = total_used + 1, updated_at = NOW()
            WHERE user_id = p_user_id;
            
            RETURN QUERY SELECT TRUE, 999, TRUE;
            RETURN;
          END IF;
          
          IF v_credits.used_today >= v_credits.daily_credits THEN
            RETURN QUERY SELECT FALSE, 0, FALSE;
            RETURN;
          END IF;
          
          UPDATE tekno_teacher_credits 
          SET used_today = used_today + 1, total_used = total_used + 1, updated_at = NOW()
          WHERE user_id = p_user_id;
          
          RETURN QUERY SELECT TRUE, (v_credits.daily_credits - v_credits.used_today - 1), FALSE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'update_weakness fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION update_weakness(
          p_user_id UUID,
          p_subject_code VARCHAR,
          p_topic VARCHAR,
          p_sub_topic VARCHAR DEFAULT NULL
        )
        RETURNS VOID AS $$
        BEGIN
          INSERT INTO tekno_teacher_weaknesses (user_id, subject_code, topic, sub_topic, wrong_count, last_wrong_at)
          VALUES (p_user_id, p_subject_code, p_topic, p_sub_topic, 1, NOW())
          ON CONFLICT (user_id, subject_code, topic, sub_topic)
          DO UPDATE SET 
            wrong_count = tekno_teacher_weaknesses.wrong_count + 1,
            last_wrong_at = NOW(),
            updated_at = NOW();
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'get_top_weaknesses fonksiyonu',
      sql: `
        CREATE OR REPLACE FUNCTION get_top_weaknesses(p_user_id UUID, p_limit INTEGER DEFAULT 5)
        RETURNS TABLE(
          subject_code VARCHAR,
          topic VARCHAR,
          sub_topic VARCHAR,
          wrong_count INTEGER,
          last_wrong_at TIMESTAMPTZ
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            w.subject_code,
            w.topic,
            w.sub_topic,
            w.wrong_count,
            w.last_wrong_at
          FROM tekno_teacher_weaknesses w
          WHERE w.user_id = p_user_id
          ORDER BY w.wrong_count DESC, w.last_wrong_at DESC
          LIMIT p_limit;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ]

  let success = 0
  let failed = 0

  for (const query of queries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: query.sql }).catch(() => {
        // Fallback: direkt SQL çalıştır
        return supabase.from('_exec').select('*').limit(0)
      })
      
      // SQL'i direkt çalıştır
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: query.sql })
      })
      
      if (!response.ok) {
        // RPC yoksa postgres-js kullan
        throw new Error('RPC not available')
      }
      
      console.log(`✅ ${query.name}`)
      success++
    } catch (err) {
      // Alternatif yöntem: supabase-js ile tablo varlığını kontrol et
      console.log(`⚠️  ${query.name} - Manuel çalıştırılmalı`)
      failed++
    }
  }

  console.log(`\n📊 Sonuç: ${success} başarılı, ${failed} manuel gerekli`)
  
  if (failed > 0) {
    console.log('\n📋 Manuel çalıştırma için SQL dosyası:')
    console.log('supabase/migrations/20260101_tekno_teacher.sql')
    console.log('\nSupabase Dashboard > SQL Editor > New Query > Yapıştır > Run')
  }
}

runMigration().catch(console.error)

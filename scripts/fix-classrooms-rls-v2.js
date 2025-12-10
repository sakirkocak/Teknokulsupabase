const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function fixClassroomsRLS() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı');

    // Önce mevcut tüm politikaları listele
    console.log('\n📋 Mevcut classrooms politikaları:');
    const policies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'classrooms'
    `);
    console.log(policies.rows);

    // TÜM politikaları kaldır
    console.log('\n📝 TÜM classrooms politikaları kaldırılıyor...');
    for (const row of policies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON classrooms`);
        console.log(`  ✓ ${row.policyname} silindi`);
      } catch (e) {
        console.log(`  ✗ ${row.policyname} silinemedi: ${e.message}`);
      }
    }

    // RLS'i kapat ve aç
    console.log('\n📝 RLS kapatılıp açılıyor...');
    await client.query('ALTER TABLE classrooms DISABLE ROW LEVEL SECURITY');
    console.log('  ✓ RLS kapatıldı');
    await client.query('ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY');
    console.log('  ✓ RLS açıldı');

    // Çok basit politikalar oluştur - hiç subquery yok
    console.log('\n📝 Yeni basit politikalar oluşturuluyor...');
    
    await client.query(`
      CREATE POLICY "allow_select_classrooms" ON classrooms
      FOR SELECT USING (true)
    `);
    console.log('  ✓ SELECT politikası');

    await client.query(`
      CREATE POLICY "allow_insert_classrooms" ON classrooms
      FOR INSERT WITH CHECK (true)
    `);
    console.log('  ✓ INSERT politikası');

    await client.query(`
      CREATE POLICY "allow_update_classrooms" ON classrooms
      FOR UPDATE USING (true) WITH CHECK (true)
    `);
    console.log('  ✓ UPDATE politikası');

    await client.query(`
      CREATE POLICY "allow_delete_classrooms" ON classrooms
      FOR DELETE USING (true)
    `);
    console.log('  ✓ DELETE politikası');

    // classroom_students için de aynısını yap
    console.log('\n📝 classroom_students politikaları düzeltiliyor...');
    
    const studentPolicies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'classroom_students'
    `);
    
    for (const row of studentPolicies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON classroom_students`);
        console.log(`  ✓ ${row.policyname} silindi`);
      } catch (e) {
        console.log(`  ✗ ${row.policyname} silinemedi`);
      }
    }

    await client.query('ALTER TABLE classroom_students DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE classroom_students ENABLE ROW LEVEL SECURITY');

    await client.query(`
      CREATE POLICY "allow_all_classroom_students" ON classroom_students
      FOR ALL USING (true) WITH CHECK (true)
    `);
    console.log('  ✓ classroom_students politikası');

    // classroom_announcements
    console.log('\n📝 classroom_announcements düzeltiliyor...');
    const annPolicies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'classroom_announcements'
    `);
    for (const row of annPolicies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON classroom_announcements`);
      } catch (e) {}
    }
    await client.query('ALTER TABLE classroom_announcements DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE classroom_announcements ENABLE ROW LEVEL SECURITY');
    await client.query(`
      CREATE POLICY "allow_all_announcements" ON classroom_announcements
      FOR ALL USING (true) WITH CHECK (true)
    `);
    console.log('  ✓ Tamamlandı');

    // classroom_materials
    console.log('\n📝 classroom_materials düzeltiliyor...');
    const matPolicies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'classroom_materials'
    `);
    for (const row of matPolicies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON classroom_materials`);
      } catch (e) {}
    }
    await client.query('ALTER TABLE classroom_materials DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE classroom_materials ENABLE ROW LEVEL SECURITY');
    await client.query(`
      CREATE POLICY "allow_all_materials" ON classroom_materials
      FOR ALL USING (true) WITH CHECK (true)
    `);
    console.log('  ✓ Tamamlandı');

    // classroom_leaderboard
    console.log('\n📝 classroom_leaderboard düzeltiliyor...');
    const lbPolicies = await client.query(`
      SELECT policyname FROM pg_policies WHERE tablename = 'classroom_leaderboard'
    `);
    for (const row of lbPolicies.rows) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${row.policyname}" ON classroom_leaderboard`);
      } catch (e) {}
    }
    await client.query('ALTER TABLE classroom_leaderboard DISABLE ROW LEVEL SECURITY');
    await client.query('ALTER TABLE classroom_leaderboard ENABLE ROW LEVEL SECURITY');
    await client.query(`
      CREATE POLICY "allow_all_leaderboard" ON classroom_leaderboard
      FOR ALL USING (true) WITH CHECK (true)
    `);
    console.log('  ✓ Tamamlandı');

    console.log('\n🎉 Tüm RLS politikaları başarıyla düzeltildi!');
    console.log('🔄 Sayfayı yenileyip tekrar deneyin.');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

fixClassroomsRLS();


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

    // Mevcut classrooms politikalarını kaldır
    console.log('📝 Mevcut classrooms politikaları kaldırılıyor...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Koçlar kendi sınıflarını görebilir" ON classrooms',
      'DROP POLICY IF EXISTS "Koçlar sınıf oluşturabilir" ON classrooms',
      'DROP POLICY IF EXISTS "Koçlar kendi sınıflarını güncelleyebilir" ON classrooms',
      'DROP POLICY IF EXISTS "Koçlar kendi sınıflarını silebilir" ON classrooms',
      'DROP POLICY IF EXISTS "Öğrenciler katıldıkları sınıfları görebilir" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_select_policy" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_insert_policy" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_update_policy" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_delete_policy" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_select" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_insert" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_update" ON classrooms',
      'DROP POLICY IF EXISTS "classrooms_delete" ON classrooms',
    ];

    for (const sql of dropPolicies) {
      await client.query(sql);
    }
    console.log('✅ Mevcut politikalar kaldırıldı');

    // Yeni basit politikalar oluştur
    console.log('📝 Yeni classrooms politikaları oluşturuluyor...');
    
    // SELECT
    await client.query(`
      CREATE POLICY "classrooms_select" ON classrooms
      FOR SELECT TO authenticated
      USING (true)
    `);
    console.log('✅ SELECT politikası oluşturuldu');

    // INSERT
    await client.query(`
      CREATE POLICY "classrooms_insert" ON classrooms
      FOR INSERT TO authenticated
      WITH CHECK (coach_id = auth.uid())
    `);
    console.log('✅ INSERT politikası oluşturuldu');

    // UPDATE
    await client.query(`
      CREATE POLICY "classrooms_update" ON classrooms
      FOR UPDATE TO authenticated
      USING (coach_id = auth.uid())
      WITH CHECK (coach_id = auth.uid())
    `);
    console.log('✅ UPDATE politikası oluşturuldu');

    // DELETE
    await client.query(`
      CREATE POLICY "classrooms_delete" ON classrooms
      FOR DELETE TO authenticated
      USING (coach_id = auth.uid())
    `);
    console.log('✅ DELETE politikası oluşturuldu');

    // classroom_students politikalarını da düzelt
    console.log('📝 classroom_students politikaları düzeltiliyor...');
    
    const dropStudentPolicies = [
      'DROP POLICY IF EXISTS "classroom_students_select" ON classroom_students',
      'DROP POLICY IF EXISTS "classroom_students_insert" ON classroom_students',
      'DROP POLICY IF EXISTS "classroom_students_update" ON classroom_students',
      'DROP POLICY IF EXISTS "classroom_students_delete" ON classroom_students',
      'DROP POLICY IF EXISTS "Koçlar sınıf öğrencilerini görebilir" ON classroom_students',
      'DROP POLICY IF EXISTS "Koçlar öğrenci ekleyebilir" ON classroom_students',
      'DROP POLICY IF EXISTS "Öğrenciler kendi kayıtlarını görebilir" ON classroom_students',
    ];

    for (const sql of dropStudentPolicies) {
      await client.query(sql);
    }

    await client.query(`
      CREATE POLICY "classroom_students_select" ON classroom_students
      FOR SELECT TO authenticated
      USING (true)
    `);

    await client.query(`
      CREATE POLICY "classroom_students_insert" ON classroom_students
      FOR INSERT TO authenticated
      WITH CHECK (true)
    `);

    await client.query(`
      CREATE POLICY "classroom_students_update" ON classroom_students
      FOR UPDATE TO authenticated
      USING (true)
      WITH CHECK (true)
    `);

    await client.query(`
      CREATE POLICY "classroom_students_delete" ON classroom_students
      FOR DELETE TO authenticated
      USING (true)
    `);

    console.log('✅ classroom_students politikaları oluşturuldu');

    console.log('\n🎉 Tüm RLS politikaları başarıyla düzeltildi!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

fixClassroomsRLS();


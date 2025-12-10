const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.cnawnprwdcfmyswqolsu',
  password: 'tofQTPUIRL9cw0Q6',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    console.log('✅ Veritabanına bağlandı\n');

    // Tüm sınıfları listele
    const classrooms = await client.query(`
      SELECT id, name, join_code FROM classrooms ORDER BY created_at DESC LIMIT 5
    `);
    console.log('📚 Son Sınıflar:');
    classrooms.rows.forEach(c => {
      console.log(`  - ${c.name} (Kod: ${c.join_code}, ID: ${c.id})`);
    });

    // Tüm classroom_students'ı listele
    const students = await client.query(`
      SELECT cs.*, c.name as classroom_name 
      FROM classroom_students cs
      LEFT JOIN classrooms c ON c.id = cs.classroom_id
      ORDER BY cs.created_at DESC
      LIMIT 20
    `);
    
    console.log('\n👥 Sınıf Öğrencileri:');
    if (students.rows.length === 0) {
      console.log('  ❌ Hiç öğrenci kaydı yok!');
    } else {
      students.rows.forEach(s => {
        console.log(`  - ${s.student_name} | Sınıf: ${s.classroom_name} | Status: ${s.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

check();


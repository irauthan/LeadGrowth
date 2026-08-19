const mysql = require('mysql2/promise');

async function dumpSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Password@123', // or 12345 or root
    database: 'leadgrowth_db'
  }).catch(async () => {
    return await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345',
      database: 'leadgrowth_db'
    });
  });

  const [tables] = await connection.query(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = 'leadgrowth_db'
    ORDER BY TABLE_NAME
  `);

  console.log('# Full Database Schema: `leadgrowth_db`\n');

  for (const t of tables) {
    const tableName = t.TABLE_NAME;
    const [columns] = await connection.query(`
      SELECT 
        COLUMN_NAME, 
        COLUMN_TYPE, 
        IS_NULLABLE, 
        COLUMN_KEY, 
        COLUMN_DEFAULT, 
        EXTRA 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'leadgrowth_db' AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    const [fks] = await connection.query(`
      SELECT 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'leadgrowth_db' AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [tableName]);

    console.log(`### Table: \`${tableName}\``);
    console.log('| Column | Type | Nullable | Key | Default | Extra |');
    console.log('|---|---|---|---|---|---|');
    for (const c of columns) {
      console.log(`| \`${c.COLUMN_NAME}\` | ${c.COLUMN_TYPE} | ${c.IS_NULLABLE} | ${c.COLUMN_KEY || ''} | ${c.COLUMN_DEFAULT !== null ? c.COLUMN_DEFAULT : 'NULL'} | ${c.EXTRA || ''} |`);
    }

    if (fks.length > 0) {
      console.log('\n**Foreign Keys:**');
      for (const fk of fks) {
        console.log(`- \`${fk.COLUMN_NAME}\` -> \`${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})\``);
      }
    }
    console.log('\n---\n');
  }

  await connection.end();
}

dumpSchema().catch(console.error);

import { register } from 'node:module';
import { urlToHttpOptions } from 'node:url';

// Force Node to dynamically bypass 'server-only' crashes
if (typeof require !== 'undefined') {
  require('module').Module._extensions['.js'] = function(module, filename) {
    if (filename.includes('server-only')) { module.exports = {}; return; }
    return require('module').Module._extensions['.js'](module, filename);
  };
}

import { pool } from "../src/connection/databaseConnection.js";

async function query(sql) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql);
    return res.rows;
  } finally {
    client.release();
  }
}

(async () => {
  const tables = await query(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type IN ('BASE TABLE', 'VIEW')
    ORDER BY table_name`);

  const columns = await query(`
    SELECT c.table_name, c.column_name, c.data_type, c.character_maximum_length,
           c.is_nullable, c.column_default, c.ordinal_position
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name, c.ordinal_position`);

  const foreignKeys = await query(`
    SELECT kcu.table_name AS from_table, kcu.column_name AS from_column,
           ccu.table_name AS to_table, ccu.column_name AS to_column,
           tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY from_table, from_column`);

  const primaryKeys = await query(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name`);

  const indexes = await query(`
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname`);

  const uniqueConstraints = await query(`
    SELECT tc.table_name, kcu.column_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name`);

  const checkConstraints = await query(`
    SELECT tc.table_name, tc.constraint_name, cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
    ORDER BY tc.table_name`);

  const rowCounts = await query(`
    SELECT relname AS table_name, n_live_tup AS estimated_row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC`);

  const enumValues = await query(`
    SELECT 'gender' AS col, gender::text AS val, COUNT(*) FROM api_user GROUP BY gender UNION ALL
    SELECT 'graduation_status', graduation_status, COUNT(*) FROM api_kid GROUP BY graduation_status UNION ALL
    SELECT 'mention', mention, COUNT(*) FROM api_kid GROUP BY mention UNION ALL
    SELECT 'marital_status', marital_status, COUNT(*) FROM api_kid GROUP BY marital_status UNION ALL
    SELECT 'level', level, COUNT(*) FROM api_kidacademics GROUP BY level`
  );

  const combinations = await query(`SELECT id, combination_name, abbreviation FROM api_combination ORDER BY id`);
  const grades = await query(`SELECT id, grade_name, admission_year_to_asyv, graduation_year_to_asyv FROM api_grade ORDER BY admission_year_to_asyv`);

  const result = {
    tables,
    columns,
    foreignKeys,
    primaryKeys,
    indexes,
    uniqueConstraints,
    checkConstraints,
    rowCounts,
    enumValues,
    combinations,
    grades
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
})();

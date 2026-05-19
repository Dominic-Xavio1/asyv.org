import pool from "../../../../connection/databaseConnection";
import { NextResponse } from "next/server";
import { requireSuperuser } from "../requireSuperuser";

export async function GET(request) {
  const auth = await requireSuperuser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  
  try {
    // Get table structures for api_eap and api_combination
    const [eapResult, combinationResult] = await Promise.all([
      pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'api_eap' 
        ORDER BY ordinal_position
      `),
      pool.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'api_combination' 
        ORDER BY ordinal_position
      `)
    ]);

    // Get sample data
    const [eapSample, combinationSample] = await Promise.all([
      pool.query("SELECT * FROM api_eap LIMIT 5"),
      pool.query("SELECT * FROM api_combination LIMIT 5")
    ]);

    return NextResponse.json({
      api_eap: {
        structure: eapResult.rows,
        sample: eapSample.rows
      },
      api_combination: {
        structure: combinationResult.rows,
        sample: combinationSample.rows
      }
    });
  } catch (err) {
    console.error("Error exploring tables:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

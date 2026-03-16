import Database from 'better-sqlite3-multiple-ciphers'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { machineIdSync } from 'node-machine-id'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sqliteDb: InstanceType<typeof Database> | null = null

function getDbKey(): string {
  const machineId = machineIdSync()
  return crypto
    .createHash('sha256')
    .update(machineId + 'clinic-app-2024-secret')
    .digest('hex')
    .substring(0, 32)
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

export function getSqliteDb() {
  if (!sqliteDb) throw new Error('SQLite not initialized. Call initDb() first.')
  return sqliteDb
}

export function initDb(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'clinic.db')
  const dbKey = getDbKey()

  console.log(`[DB] Initializing encrypted database at: ${dbPath}`)

  const isNew = !fs.existsSync(dbPath)

  sqliteDb = new Database(dbPath)

  // MUST be first pragma — sets encryption key before any reads
  sqliteDb.pragma(`key='${dbKey}'`)

  // If existing unencrypted DB, rekey it
  if (!isNew) {
    try {
      sqliteDb.pragma('user_version')
    } catch {
      // DB is unencrypted (legacy) — encrypt it
      console.log('[DB] Encrypting existing database...')
      sqliteDb.close()
      _encryptLegacyDb(dbPath, dbKey)
      sqliteDb = new Database(dbPath)
      sqliteDb.pragma(`key='${dbKey}'`)
    }
  }

  sqliteDb.pragma('journal_mode = WAL')
  sqliteDb.pragma('foreign_keys = ON')
  sqliteDb.pragma('synchronous = NORMAL')

  db = drizzle(sqliteDb, { schema })
  console.log('[DB] Encrypted database initialized')
}

function _encryptLegacyDb(dbPath: string, key: string): void {
  const tmpPath = dbPath + '.encrypting'
  try {
    // Open the plain (unencrypted) database
    const plain = new Database(dbPath)

    // Read full schema (tables, indexes, triggers, views)
    const objects = plain.prepare(
      `SELECT type, name, sql FROM sqlite_master
       WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
       ORDER BY type DESC`
    ).all() as { type: string; name: string; sql: string }[]

    // Read all rows from each table
    const tableRows: Record<string, Record<string, unknown>[]> = {}
    for (const obj of objects) {
      if (obj.type === 'table') {
        tableRows[obj.name] = plain.prepare(`SELECT * FROM "${obj.name}"`).all() as Record<string, unknown>[]
      }
    }
    plain.close()

    // Create a new encrypted database
    const enc = new Database(tmpPath)
    enc.pragma(`key='${key}'`)
    enc.pragma('journal_mode = WAL')
    enc.pragma('foreign_keys = OFF') // disable during bulk insert

    // Recreate schema
    for (const obj of objects) {
      if (obj.sql) enc.exec(obj.sql)
    }

    // Insert all data
    for (const obj of objects) {
      if (obj.type !== 'table') continue
      const rows = tableRows[obj.name]
      if (!rows?.length) continue
      const cols = Object.keys(rows[0])
      const placeholders = cols.map(() => '?').join(', ')
      const stmt = enc.prepare(
        `INSERT INTO "${obj.name}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`
      )
      const insertAll = enc.transaction((rs: Record<string, unknown>[]) => {
        for (const row of rs) stmt.run(Object.values(row))
      })
      insertAll(rows)
    }

    enc.pragma('foreign_keys = ON')
    enc.close()

    fs.renameSync(dbPath, dbPath + '.pre_encrypt_backup')
    fs.renameSync(tmpPath, dbPath)
    console.log('[DB] Legacy database encrypted successfully')
  } catch (err) {
    console.error('[DB] Failed to encrypt legacy database:', err)
    // Clean up temp file if it exists
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    // Restore original backup if main file was already moved
    if (fs.existsSync(dbPath + '.pre_encrypt_backup') && !fs.existsSync(dbPath)) {
      fs.renameSync(dbPath + '.pre_encrypt_backup', dbPath)
    }
  }
}

export function closeDb(): void {
  if (sqliteDb) {
    sqliteDb.close()
    sqliteDb = null
    db = null
    console.log('[DB] Database closed')
  }
}

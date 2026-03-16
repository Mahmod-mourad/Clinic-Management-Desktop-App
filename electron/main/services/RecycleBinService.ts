import { getSqliteDb } from '../db'

export class RecycleBinService {
  getDeletedPatients() {
    return getSqliteDb()
      .prepare(
        `SELECT p.*, u.name as deleted_by_name
         FROM patients p
         LEFT JOIN users u ON u.id = p.deleted_by
         WHERE p.is_active = 0 AND p.deleted_at IS NOT NULL
         ORDER BY p.deleted_at DESC`,
      )
      .all()
  }

  restorePatient(id: number): void {
    getSqliteDb()
      .prepare(
        `UPDATE patients
         SET is_active = 1,
             deleted_at = NULL,
             deleted_by = NULL,
             delete_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .run(id)
  }

  permanentDelete(id: number): void {
    getSqliteDb()
      .prepare(`DELETE FROM patients WHERE id = ? AND is_active = 0`)
      .run(id)
  }

  autoPurge(): void {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const result = getSqliteDb()
      .prepare(`DELETE FROM patients WHERE is_active = 0 AND deleted_at < ?`)
      .run(cutoff.toISOString()) as { changes: number }
    if (result.changes > 0) {
      console.log(`[RECYCLE] Purged ${result.changes} old records`)
    }
  }
}

export const recycleBinService = new RecycleBinService()

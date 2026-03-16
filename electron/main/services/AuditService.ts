import { getSqliteDb } from '../db/index'

type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'print' | 'payment' | 'restore'
type AuditEntity = 'patient' | 'appointment' | 'invoice' | 'payment' | 'medical_record' | 'user' | 'settings' | 'backup'

export class AuditService {
  log(params: {
    userId:    number
    action:    AuditAction
    entity:    AuditEntity
    entityId?: number
    summary?:  string
    oldValue?: object
    newValue?: object
  }): void {
    try {
      getSqliteDb().prepare(`
        INSERT INTO audit_log (user_id, action, entity, entity_id, summary, old_value, new_value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        params.userId,
        params.action,
        params.entity,
        params.entityId ?? null,
        params.summary ?? null,
        params.oldValue ? JSON.stringify(params.oldValue) : null,
        params.newValue ? JSON.stringify(params.newValue) : null,
      )
    } catch (e) {
      // Never let audit failures crash the main operation
      console.error('[AUDIT] Log failed:', e)
    }
  }

  getLog(filters?: {
    userId?: number
    entity?: string
    action?: string
    from?:   string
    to?:     string
    limit?:  number
  }) {
    let query = `
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE 1=1
    `
    const params: (string | number)[] = []

    if (filters?.userId) { query += ' AND al.user_id = ?';     params.push(filters.userId) }
    if (filters?.entity) { query += ' AND al.entity = ?';      params.push(filters.entity) }
    if (filters?.action) { query += ' AND al.action = ?';      params.push(filters.action) }
    if (filters?.from)   { query += ' AND al.created_at >= ?'; params.push(filters.from) }
    if (filters?.to)     { query += ' AND al.created_at <= ?'; params.push(filters.to + ' 23:59:59') }

    query += ` ORDER BY al.created_at DESC LIMIT ${filters?.limit ?? 200}`

    return getSqliteDb().prepare(query).all(...params)
  }

  purgeOldLogs(): void {
    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)
    getSqliteDb().prepare(
      'DELETE FROM audit_log WHERE created_at < ?'
    ).run(cutoff.toISOString())
  }
}

export const auditService = new AuditService()

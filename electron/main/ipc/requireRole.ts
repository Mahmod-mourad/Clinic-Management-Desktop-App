import { getDb } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

type Role = 'admin' | 'doctor' | 'receptionist'

export async function requireRole(userId: number | undefined, allowedRoles: Role[]): Promise<void> {
  if (!userId) throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء')
  const db = getDb()
  const user = db.select().from(users).where(eq(users.id, userId)).get()
  if (!user || !allowedRoles.includes(user.role as Role)) {
    throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء')
  }
}

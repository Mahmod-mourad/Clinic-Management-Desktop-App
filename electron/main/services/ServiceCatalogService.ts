import { getDb } from '../db'
import { services } from '../db/schema'
import { eq } from 'drizzle-orm'

export class ServiceCatalogService {
  getAll(includeInactive = false) {
    const db = getDb()
    if (includeInactive) {
      return db.select().from(services).all()
    }
    return db.select().from(services).where(eq(services.isActive, true)).all()
  }

  create(data: {
    name: string
    nameEn?: string
    category?: string
    price: number
    duration?: number
    description?: string
    sortOrder?: number
  }) {
    const db = getDb()
    const result = db.insert(services).values({ ...data, isActive: true }).run()
    return { id: Number(result.lastInsertRowid) }
  }

  update(id: number, data: Partial<{
    name: string
    nameEn: string
    category: string
    price: number
    duration: number
    description: string
    sortOrder: number
  }>) {
    const db = getDb()
    db.update(services)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(services.id, id))
      .run()
  }

  toggleActive(id: number) {
    const db = getDb()
    const service = db.select().from(services).where(eq(services.id, id)).get()
    if (!service) return
    db.update(services)
      .set({ isActive: !service.isActive, updatedAt: new Date().toISOString() })
      .where(eq(services.id, id))
      .run()
  }
}

export const serviceCatalogService = new ServiceCatalogService()

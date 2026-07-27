import { sql } from 'drizzle-orm'
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const requests = sqliteTable(
  'requests',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    type: text('type').notNull(),
    date: text('date').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    responsible: text('responsible').notNull(),
    notes: text('notes').notNull().default(''),
    status: text('status').notNull().default('Pendiente'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('requests_schedule_idx').on(
      table.type,
      table.date,
      table.startTime,
      table.endTime,
    ),
  ],
)

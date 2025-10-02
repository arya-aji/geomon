import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const petugas = pgTable("petugas", {
  id: text("id").primaryKey(),
  nama: text("nama").notNull(),
  email: text("email").unique(),
  telepon: text("telepon"),
  jabatan: text("jabatan").notNull(),
  wilayahKerja: text("wilayah_kerja").notNull(),
  status: text("status").notNull().default("aktif"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export type Petugas = typeof petugas.$inferSelect;
export type NewPetugas = typeof petugas.$inferInsert;

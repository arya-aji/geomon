import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const daftarSipw = pgTable("daftar_sipw", {
  id: text("id").primaryKey(),
  id_subsls: text("id_subsls").notNull(),
  idfrs: integer("idfrs"),
  idsls: text("idsls"),
  kdprov: text("kdprov"),
  kdkab: text("kdkab"),
  kdkec: text("kdkec"),
  kddesa: text("kddesa"),
  kdsls: text("kdsls"),
  klas: text("klas"),
  nmprov: text("nmprov"),
  nmkab: text("nmkab").notNull(),
  nmkec: text("nmkec").notNull(),
  nmdesa: text("nmdesa").notNull(),
  nama_sls: text("nama_sls").notNull(),
  jenis_sls: text("jenis_sls"),
  ketua_sls: text("ketua_sls"),
  semester_id: text("semester_id"),
  semester: text("semester"),
  j_subsls: text("j_subsls"),
  muatan_kk: text("muatan_kk"),
  btt: text("btt"),
  btt_kosong: text("btt_kosong"),
  bku: text("bku"),
  bbtt_non_usaha: text("bbtt_non_usaha"),
  muatan_usaha: text("muatan_usaha"),
  muatan_total: text("muatan_total"),
  nama_wke: text("nama_wke"),
  jam_operasional: text("jam_operasional"),
  jumlah_shift: text("jumlah_shift"),
  telepon_email: text("telepon_email"),
  muatan_dominan: text("muatan_dominan"),
  flag_perubahan_sls: text("flag_perubahan_sls"),
  is_deleted: text("is_deleted"),
  kd_subsls: text("kd_subsls").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export type DaftarSipw = typeof daftarSipw.$inferSelect;
export type NewDaftarSipw = typeof daftarSipw.$inferInsert;

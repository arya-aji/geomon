import { db } from '@/db/index';
import { daftarSipw } from '@/db/schema/daftar_sipw';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';

async function getDaftarSls() {
    try {
        const data = await db
            .select({
                nmkab: daftarSipw.nmkab,
                nmkec: daftarSipw.nmkec,
                nmdesa: daftarSipw.nmdesa,
                idsubsls: daftarSipw.id_subsls,
                nama_sls: daftarSipw.nama_sls,
                kd_subsls: daftarSipw.kd_subsls,
            })
            .from(daftarSipw)
            .orderBy(daftarSipw.nmkab, daftarSipw.nmkec, daftarSipw.nmdesa, daftarSipw.nama_sls);

        return data;
    } catch (error) {
        console.error('Error fetching daftar SLS:', error);
        return [];
    }
}

export default async function DaftarSlsPage() {
    const data = await getDaftarSls();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Daftar SLS</h2>
            </div>

            <div className="rounded-md border">
                <DataTable columns={columns} data={data} />
            </div>
        </div>
    );
}

import { db } from "@/db";
import { petugas } from "@/db/schema/petugas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MapPin, Briefcase } from "lucide-react";

async function getPetugasData() {
    try {
        const allPetugas = await db.select().from(petugas);
        return allPetugas;
    } catch (error) {
        console.error("Error fetching petugas data:", error);
        return [];
    }
}

export default async function PetugasPage() {
    const petugasList = await getPetugasData();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Data Petugas</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {petugasList.map((petugas) => (
                    <Card key={petugas.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{petugas.nama}</CardTitle>
                                </div>
                                <Badge
                                    variant={petugas.status === 'aktif' ? 'default' : 'secondary'}
                                    className="ml-2"
                                >
                                    {petugas.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>{petugas.jabatan}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>Wilayah: {petugas.wilayahKerja}</span>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                {petugas.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`mailto:${petugas.email}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {petugas.email}
                                        </a>
                                    </div>
                                )}

                                {petugas.telepon && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={`tel:${petugas.telepon}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {petugas.telepon}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {petugasList.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Belum ada data petugas yang tersedia.</p>
                </div>
            )}
        </div>
    );
}

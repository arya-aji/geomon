"use client";

import { ColumnDef } from "@tanstack/react-table";

export type DaftarSls = {
    nmkab: string;
    nmkec: string;
    nmdesa: string;
    idsubsls: string;
    nama_sls: string;
    kd_subsls: string;
};

export const columns: ColumnDef<DaftarSls>[] = [
    {
        accessorKey: "nmkab",
        header: "Kabupaten",
    },
    {
        accessorKey: "nmkec",
        header: "Kecamatan",
    },
    {
        accessorKey: "nmdesa",
        header: "Desa",
    },
    {
        accessorKey: "idsubsls",
        header: "ID Sub SLS",
    },
    {
        accessorKey: "nama_sls",
        header: "Nama SLS",
    },
    {
        accessorKey: "kd_subsls",
        header: "Kode Sub SLS",
    },
];

"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Map,
  BarChart3,
  Building,
  Database,
  Shield,
  Zap,
  Globe,
  Palette,
  Package,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButtons, HeroAuthButtons } from "@/components/auth-buttons";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="text-center py-12 sm:py-16 relative px-4">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <AuthButtons />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
          <div className="w-12 h-12 sm:w-[60px] sm:h-[60px] bg-gradient-to-br from-blue-600 to-green-500 rounded-xl flex items-center justify-center">
            <Map className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 bg-clip-text text-transparent font-parkinsans">
            GEOMON
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 mb-8">
          Sistem Geospasial Monitoring Wilkerstat untuk BPS Kota Jakarta Pusat
        </p>

        <HeroAuthButtons />
      </div>

      <main className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-8 max-w-5xl">
        {/* Project Overview */}
        <div className="text-center mb-8">
          <div className="text-4xl sm:text-5xl mb-2">🗺️</div>
          <div className="font-bold text-lg sm:text-xl mb-2">Monitoring Geospasial Wilkerstat</div>
          <div className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Aplikasi web berbasis geospasial yang dirancang khusus untuk membantu BPS Kota Jakarta Pusat
            dalam memantau dan mengelola data statistik wilayah kerja secara visual dan interaktif.
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Pemetaan Geospasial */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200/50 dark:border-blue-700/30">
            <div className="flex items-center gap-3 mb-3">
              <Map className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-lg">Pemetaan Geospasial</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Visualisasi data statistik pada peta</li>
              <li>• Peta interaktif dengan zoom & pan</li>
              <li>• Layer data wilayah kerja</li>
              <li>• Analisis spasial real-time</li>
            </ul>
          </Card>

          {/* Dashboard Monitoring */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200/50 dark:border-green-700/30">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-lg">Dashboard Monitoring</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Analisis data real-time</li>
              <li>• Grafik dan chart interaktif</li>
              <li>• Indikator kinerja Wilkerstat</li>
              <li>• Export data berbagai format</li>
            </ul>
          </Card>

          {/* Manajemen Wilayah */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center gap-3 mb-3">
              <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-lg">Manajemen Wilayah</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Pengelolaan batas wilayah</li>
              <li>• Data demografi Wilkerstat</li>
              <li>• Update data wilayah kerja</li>
              <li>• Validasi data spasial</li>
            </ul>
          </Card>
        </div>

      </main>
    </div>
  );
}

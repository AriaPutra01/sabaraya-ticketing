/**
 * Konfigurasi Palet Warna & Identitas Visual Sabaraya (SSM)
 * Diekstraksi langsung dari logo resmi PT Sabaraya Sinergi Medika (logo-ssm.png).
 * 
 * Aturan Antislop:
 * - Capped active palette: 2 warna inti (SSM Blue + SSM Red) + 1 netral slate.
 * - Tanpa gradien ungu-biru generik atau glow berlebihan.
 */

export const THEME = {
  brand: {
    name: "PT Sabaraya Sagara Mandiri",
    shortName: "SSM",
    appTitle: "Sabaraya Ticketing",
    logoPath: "/logo-ssm.png",
  },
  colors: {
    // SSM Primary Blue (Kepercayaan, Rumah Sakit, Rekayasa Alat Medis)
    primary: {
      DEFAULT: "#0A4D94", // SSM Corporate Blue
      hover: "#083B72",
      light: "#EFF6FF",
      border: "#BFDBFE",
      ring: "#3B82F6",
      foreground: "#FFFFFF",
    },
    // SSM Urgent Red (Indikator Kedaruratan Medis, Tiket Urgent, Tombol Aksi Kritis)
    urgent: {
      DEFAULT: "#D32F2F", // SSM Arrow Red
      hover: "#B71C1C",
      light: "#FEF2F2",
      border: "#FECACA",
      foreground: "#FFFFFF",
    },
    // Netralitas Klinis (Background, Border, Teks Berkualitas Tinggi)
    neutral: {
      canvas: "#F8FAFC", // Slate-50
      surface: "#FFFFFF",
      border: "#E2E8F0", // Slate-200
      subtle: "#64748B", // Slate-500
      heading: "#0F172A", // Slate-900
    },
    // Status Semantik Fungsional
    status: {
      pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" }, // Amber
      assigned: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" }, // Blue
      inProgress: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" }, // Emerald
      resolved: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" }, // Mint
      closed: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" }, // Slate
    },
  },
} as const;

export type ThemeColors = typeof THEME.colors;

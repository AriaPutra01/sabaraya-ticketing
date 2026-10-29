"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User, LogOut, Ticket, Calendar, MapPin, Users,
  CheckCircle, XCircle, Plus, RefreshCw, AlertCircle, Clock,
  Eye, Search, Edit3, Trash2, MessageSquare, BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { LiveChatQueueModal } from "@/components/dashboard/LiveChatQueueModal";
import { KnowledgeBaseModal } from "@/components/dashboard/KnowledgeBaseModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tickets" | "schedules" | "regions" | "users">("tickets");
  const [loading, setLoading] = useState(true);

  // Data states
  const [tickets, setTickets] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [divisionFilter, setDivisionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Chat & Knowledge Modals
  const [liveChatModalOpen, setLiveChatModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);

  // Generic Reusable Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "primary";
    confirmText?: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "danger",
    onConfirm: async () => {},
  });

  // Modals
  const [detailModal, setDetailModal] = useState<{ open: boolean; ticket: any | null }>({
    open: false,
    ticket: null,
  });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; ticketId: string; reason: string }>({
    open: false,
    ticketId: "",
    reason: "",
  });
  const [resolveModal, setResolveModal] = useState<{ open: boolean; ticketId: string; note: string }>({
    open: false,
    ticketId: "",
    note: "",
  });
  const [assignModal, setAssignModal] = useState<{ open: boolean; ticketId: string; assigneeId: string }>({
    open: false,
    ticketId: "",
    assigneeId: "",
  });
  const [runningAutoAssign, setRunningAutoAssign] = useState(false);
  const [scheduleModal, setScheduleModal] = useState({
    open: false,
    userId: "",
    regionId: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [regionModal, setRegionModal] = useState<{
    open: boolean;
    isEdit: boolean;
    id?: string;
    name: string;
    coverage: string;
  }>({
    open: false,
    isEdit: false,
    name: "",
    coverage: "",
  });
  const [userModal, setUserModal] = useState<{
    open: boolean;
    isEdit: boolean;
    id?: string;
    name: string;
    email: string;
    password: string;
    role: string;
    division: string;
    phone: string;
    maxActiveTickets: number;
  }>({
    open: false,
    isEdit: false,
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    division: "TEKNISI",
    phone: "",
    maxActiveTickets: 5,
  });

  // 1. Initial Load: Check Auth
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) {
          router.push("/masuk");
          return;
        }
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/masuk");
      });
  }, [router]);

  // 2. Fetch Data when Tab or User Changes
  useEffect(() => {
    if (!user) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, statusFilter, divisionFilter, searchQuery]);

  const loadData = () => {
    if (activeTab === "tickets") {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (divisionFilter !== "ALL") params.append("division", divisionFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      fetch(`/api/tickets?${params.toString()}`)
        .then((res) => res.json())
        .then((res) => res.success && setTickets(res.data));
    } else if (activeTab === "schedules") {
      fetch("/api/admin/schedules")
        .then((res) => res.json())
        .then((res) => res.success && setSchedules(res.data));
      fetch("/api/admin/employees")
        .then((res) => res.json())
        .then((res) => res.success && setEmployees(res.data));
      fetch("/api/regions")
        .then((res) => res.json())
        .then((res) => res.success && setRegions(res.data));
    } else if (activeTab === "regions") {
      fetch("/api/admin/regions")
        .then((res) => res.json())
        .then((res) => res.success && setRegions(res.data));
    } else if (activeTab === "users" && user.role === "SUPERADMIN") {
      fetch("/api/admin/users")
        .then((res) => res.json())
        .then((res) => res.success && setUsersList(res.data));
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }
    toast.success("Berhasil keluar.");
    router.push("/masuk");
    router.refresh();
  };

  // Open ticket detail
  const handleOpenDetail = async (ticket: any) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailModal({ open: true, ticket: data.data });
      } else {
        setDetailModal({ open: true, ticket });
      }
    } catch {
      setDetailModal({ open: true, ticket });
    }
  };

  // Actions for Tickets
  const handleStartProgress = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}/progress`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (detailModal.open) setDetailModal({ open: false, ticket: null });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal memulai pengerjaan.");
    }
  };

  const handleResolveTicket = async () => {
    if (!resolveModal.note.trim()) {
      toast.error("Catatan hasil pengerjaan wajib diisi.");
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${resolveModal.ticketId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNote: resolveModal.note }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setResolveModal({ open: false, ticketId: "", note: "" });
        if (detailModal.open) setDetailModal({ open: false, ticket: null });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menyelesaikan tiket.");
    }
  };

  const handleRejectTicket = async () => {
    if (rejectModal.reason.trim().length < 5) {
      toast.error("Alasan penolakan wajib diisi minimal 5 karakter.");
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${rejectModal.ticketId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectModal.reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (data.data?.info) toast.info(data.data.info);
        setRejectModal({ open: false, ticketId: "", reason: "" });
        if (detailModal.open) setDetailModal({ open: false, ticket: null });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal memproses penolakan.");
    }
  };

  const handleManualAssign = async () => {
    if (!assignModal.assigneeId) {
      toast.error("Pilih staf teknisi/IT.");
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${assignModal.ticketId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assignModal.assigneeId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAssignModal({ open: false, ticketId: "", assigneeId: "" });
        if (detailModal.open) setDetailModal({ open: false, ticket: null });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menugaskan tiket.");
    }
  };

  const handleCloseTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}/close`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (detailModal.open) setDetailModal({ open: false, ticket: null });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menutup tiket.");
    }
  };

  const handleTriggerAutoAssign = async () => {
    setRunningAutoAssign(true);
    const toastId = toast.loading("Memeriksa tiket pending > 30 menit...");
    try {
      const res = await fetch("/api/admin/tickets/auto-assign?minutes=30", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
        loadData();
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch {
      toast.error("Gagal menjalankan auto-assign.", { id: toastId });
    } finally {
      setRunningAutoAssign(false);
    }
  };

  // Add Schedule
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleModal),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setScheduleModal({ open: false, userId: "", regionId: "", startTime: "", endTime: "", notes: "" });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menambahkan jadwal.");
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Jadwal Siaga",
      message: "Apakah Anda yakin ingin menghapus jadwal siaga ini?",
      variant: "danger",
      confirmText: "Hapus Jadwal",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/schedules/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message);
            loadData();
          } else {
            toast.error(data.message);
          }
        } catch {
          toast.error("Gagal menghapus jadwal.");
        }
      },
    });
  };

  // Add / Edit Region
  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = regionModal.isEdit ? `/api/admin/regions/${regionModal.id}` : "/api/admin/regions";
    const method = regionModal.isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regionModal.name, coverage: regionModal.coverage }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setRegionModal({ open: false, isEdit: false, name: "", coverage: "" });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menyimpan daerah.");
    }
  };

  // Toggle Region Active
  const handleToggleRegion = async (region: any) => {
    try {
      const res = await fetch(`/api/admin/regions/${region.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !region.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Daerah ${region.name} berhasil ${region.isActive ? "dinonaktifkan" : "diaktifkan"}.`);
        loadData();
      }
    } catch {
      toast.error("Gagal memperbarui status daerah.");
    }
  };

  // Add / Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = userModal.isEdit ? `/api/admin/users/${userModal.id}` : "/api/admin/users";
    const method = userModal.isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userModal),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setUserModal({ open: false, isEdit: false, name: "", email: "", password: "", role: "EMPLOYEE", division: "TEKNISI", phone: "", maxActiveTickets: 5 });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menyimpan data pengguna.");
    }
  };

  // Toggle User Active
  const handleToggleUser = async (targetUser: any) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Pengguna ${targetUser.name} berhasil ${targetUser.isActive ? "dinonaktifkan" : "diaktifkan"}.`);
        loadData();
      }
    } catch {
      toast.error("Gagal memperbarui status pengguna.");
    }
  };

  // Delete Region
  const handleDeleteRegion = (id: string, name: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Daerah & Cakupan",
      message: `Hapus daerah "${name}" secara permanen? Data yang berkaitan mungkin terpengaruh.`,
      variant: "danger",
      confirmText: "Hapus Daerah",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/regions/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message);
            loadData();
          } else {
            toast.error(data.message);
          }
        } catch {
          toast.error("Gagal menghapus daerah.");
        }
      },
    });
  };

  // Delete User
  const handleDeleteUser = (id: string, name: string) => {
    setConfirmModal({
      open: true,
      title: "Hapus Pengguna",
      message: `Hapus akun pengguna "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      variant: "danger",
      confirmText: "Hapus Pengguna",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success(data.message);
            loadData();
          } else {
            toast.error(data.message);
          }
        } catch {
          toast.error("Gagal menghapus pengguna.");
        }
      },
    });
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / User Profile */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-ssm-blue text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ssm-blue-light text-ssm-blue">
                {user.role} {user.division ? `• ${user.division}` : ""}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email} • {user.phone || "No HP belum diisi"}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === "tickets"
              ? "bg-ssm-blue text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ticket className="w-4 h-4" />
          {user.role === "EMPLOYEE" ? "Tiket Tugas Saya" : "Manajemen Tiket"}
        </button>

        {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
          <>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === "schedules"
                  ? "bg-ssm-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Penjadwalan Siaga
            </button>

            <button
              onClick={() => setActiveTab("regions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === "regions"
                  ? "bg-ssm-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Master Daerah & Cakupan
            </button>
          </>
        )}

        {user.role === "SUPERADMIN" && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === "users"
                ? "bg-ssm-blue text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Kelola Pengguna
          </button>
        )}

        <button
          onClick={() => setLiveChatModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Antrean Live CS</span>
        </button>

        {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
          <button
            onClick={() => setKnowledgeModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-ssm-blue-light/60 hover:bg-ssm-blue-light text-ssm-blue border border-ssm-blue/20 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Basis Pengetahuan AI</span>
          </button>
        )}

        <button
          onClick={loadData}
          className="ml-auto p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition"
          title="Segarkan Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: TICKETS */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Filters & Search Header */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari kode tiket, instansi, pelapor, atau judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ssm-blue"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">PENDING</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <select
                value={divisionFilter}
                onChange={(e) => setDivisionFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="ALL">Semua Divisi</option>
                <option value="TEKNISI">TEKNISI</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Daftar Tiket ({tickets.length} Tiket Ditemukan)
            </h2>

            {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
              <button
                onClick={handleTriggerAutoAssign}
                disabled={runningAutoAssign}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                title="Tugaskan otomatis tiket pending yang belum di-assign lebih dari 30 menit"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                {runningAutoAssign ? "Memproses..." : "⚡ Jalankan Auto-Assign (>30 Mnt)"}
              </button>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-sm">
              Tidak ada tiket yang cocok dengan filter atau pencarian.
            </div>
          ) : (
            <div className="grid gap-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ssm-blue">{t.code}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {t.division}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        t.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                        t.status === "ASSIGNED" ? "bg-ssm-blue-light text-ssm-blue" :
                        t.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-800" :
                        t.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {t.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                        Urgensi: {t.priority}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(t.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <p><span className="text-slate-400">Instansi:</span> <b>{t.institutionName}</b></p>
                    <p><span className="text-slate-400">Pelapor:</span> {t.reporterName} ({t.reporterPhone})</p>
                    <p><span className="text-slate-400">Wilayah:</span> {t.region?.name || "-"}</p>
                    <p><span className="text-slate-400">Petugas:</span> <b>{t.assignee?.name || "Belum ditugaskan"}</b></p>
                    {t.rejectionReason && (
                      <p className="sm:col-span-2 text-rose-700">
                        <span className="text-slate-400">Alasan Tolak Terakhir:</span> {t.rejectionReason}
                      </p>
                    )}
                    {t.resolutionNote && (
                      <p className="sm:col-span-2 text-emerald-700">
                        <span className="text-slate-400">Penyelesaian:</span> {t.resolutionNote}
                      </p>
                    )}
                  </div>

                  {/* Actions according to role & status */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenDetail(t)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat Rincian
                    </button>

                    {/* Employee Actions */}
                    {user.role === "EMPLOYEE" && t.assigneeId === user.id && (
                      <>
                        {t.status === "ASSIGNED" && (
                          <>
                            <button
                              onClick={() => handleStartProgress(t.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Terima Tugas (Setuju)
                            </button>

                            <button
                              onClick={() => setRejectModal({ open: true, ticketId: t.id, reason: "" })}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition border border-rose-200"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Tolak Tugas
                            </button>
                          </>
                        )}

                        {t.status === "IN_PROGRESS" && (
                          <>
                            <button
                              onClick={() => setResolveModal({ open: true, ticketId: t.id, note: "" })}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Selesaikan Tiket
                            </button>

                            <button
                              onClick={() => setRejectModal({ open: true, ticketId: t.id, reason: "" })}
                              className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition border border-rose-200"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Alihkan / Tolak Tiket
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* Admin / Superadmin Actions */}
                    {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
                      <>
                        {t.status === "PENDING" ? (
                          <button
                            onClick={() => {
                              fetch("/api/admin/employees")
                                .then((res) => res.json())
                                .then((res) => res.success && setEmployees(res.data));
                              setAssignModal({ open: true, ticketId: t.id, assigneeId: "" });
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                          >
                            <User className="w-3.5 h-3.5" />
                            Tugaskan Petugas
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              fetch("/api/admin/employees")
                                .then((res) => res.json())
                                .then((res) => res.success && setEmployees(res.data));
                              setAssignModal({ open: true, ticketId: t.id, assigneeId: "" });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            Ubah Petugas
                          </button>
                        )}

                        {t.status === "RESOLVED" && (
                          <button
                            onClick={() => handleCloseTicket(t.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Tutup Tiket Resmi
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULES */}
      {activeTab === "schedules" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Jadwal Siaga Karyawan ({schedules.length})</h2>
            <button
              onClick={() => {
                if (employees.length > 0 && regions.length > 0) {
                  setScheduleModal({
                    open: true,
                    userId: employees[0].id,
                    regionId: regions[0].id,
                    startTime: "",
                    endTime: "",
                    notes: "Jadwal Siaga Reguler",
                  });
                } else {
                  toast.error("Pastikan data karyawan dan daerah sudah tersedia.");
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Jadwal Siaga
            </button>
          </div>

          <div className="grid gap-3">
            {schedules.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{s.user.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ssm-blue-light text-ssm-blue">
                      {s.user.division}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Wilayah: {s.region.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cakupan: {s.region.coverage}
                  </p>
                  <p className="text-xs text-slate-700 mt-1 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ssm-blue" />
                    {format(new Date(s.startTime), "dd MMM yyyy, HH:mm", { locale: localeId })} s/d{" "}
                    {format(new Date(s.endTime), "dd MMM yyyy, HH:mm", { locale: localeId })}
                  </p>
                  {s.notes && <p className="text-[11px] text-slate-400 mt-0.5">Catatan: {s.notes}</p>}
                </div>

                <button
                  onClick={() => handleDeleteSchedule(s.id)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGIONS */}
      {activeTab === "regions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Master Daerah & Cakupan ({regions.length})</h2>
            <button
              onClick={() => setRegionModal({ open: true, isEdit: false, name: "", coverage: "" })}
              className="px-3.5 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Daerah Baru
            </button>
          </div>

          <div className="grid gap-3">
            {regions.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{r.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {r.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <span className="font-semibold text-slate-800">Cakupan Wilayah: </span>
                    {r.coverage}
                  </p>
                  <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                    <span>Tiket: {r._count?.tickets ?? 0}</span>
                    <span>Jadwal Aktif: {r._count?.schedules ?? 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRegionModal({ open: true, isEdit: true, id: r.id, name: r.name, coverage: r.coverage })}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    title="Ubah Rincian"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleRegion(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      r.isActive ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {r.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => handleDeleteRegion(r.id, r.name)}
                    className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                    title="Hapus Daerah"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS (SUPERADMIN ONLY) */}
      {activeTab === "users" && user.role === "SUPERADMIN" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Daftar Pengguna ({usersList.length})</h2>
            <button
              onClick={() => setUserModal({ open: true, isEdit: false, name: "", email: "", password: "", role: "EMPLOYEE", division: "TEKNISI", phone: "", maxActiveTickets: 5 })}
              className="px-3.5 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun Baru
            </button>
          </div>

          <div className="grid gap-3">
            {usersList.map((u) => (
              <div key={u.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{u.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {u.role}
                    </span>
                    {u.division && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ssm-blue-light text-ssm-blue">
                        {u.division}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{u.email} • Telp: {u.phone || "-"}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserModal({
                      open: true,
                      isEdit: true,
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      password: "",
                      role: u.role,
                      division: u.division || "TEKNISI",
                      phone: u.phone || "",
                      maxActiveTickets: u.maxActiveTickets || 5,
                    })}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    title="Ubah Pengguna"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleUser(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      u.isActive ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  {u.id !== user.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DETAIL TIKET LENGKAP */}
      {detailModal.open && detailModal.ticket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-ssm-blue">{detailModal.ticket.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ssm-blue-light text-ssm-blue">
                    {detailModal.ticket.division}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                    {detailModal.ticket.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{detailModal.ticket.title}</h3>
              </div>
              <button
                onClick={() => setDetailModal({ open: false, ticket: null })}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Description & Photo */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Rincian Keluhan:</p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {detailModal.ticket.description}
              </div>

              {(detailModal.ticket.photoUrls?.length > 0 || detailModal.ticket.photoUrl) && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">Lampiran Bukti Foto ({detailModal.ticket.photoUrls?.length || 1} Foto):</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(detailModal.ticket.photoUrls?.length > 0 ? detailModal.ticket.photoUrls : [detailModal.ticket.photoUrl]).map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-slate-200 aspect-video hover:opacity-90 hover:ring-2 hover:ring-ssm-blue transition bg-slate-100"
                      >
                        <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900 mb-1">Informasi Instansi</p>
                <p><span className="text-slate-500">Instansi:</span> <b>{detailModal.ticket.institutionName}</b></p>
                <p><span className="text-slate-500">Pelapor:</span> {detailModal.ticket.reporterName} ({detailModal.ticket.reporterPhone})</p>
                <p><span className="text-slate-500">Alamat:</span> {detailModal.ticket.reporterAddress || "-"}</p>
                <p><span className="text-slate-500">Wilayah:</span> {detailModal.ticket.region?.name || "-"}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900 mb-1">Informasi Perangkat</p>
                <p><span className="text-slate-500">Merek/Tipe:</span> {detailModal.ticket.deviceBrand || "-"}</p>
                <p><span className="text-slate-500">Nomor Seri:</span> {detailModal.ticket.serialNumber || "-"}</p>
                <p><span className="text-slate-500">Urgensi:</span> <b>{detailModal.ticket.priority}</b></p>
                <p><span className="text-slate-500">Petugas:</span> <b>{detailModal.ticket.assignee?.name || "Belum ditugaskan"}</b></p>
              </div>
            </div>

            {/* Activities Timeline */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Riwayat Perjalanan Tiket:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detailModal.ticket.activities?.map((act: any) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800">{act.note || act.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Oleh: {act.actorName} • {format(new Date(act.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* Employee Actions inside Modal */}
                {user.role === "EMPLOYEE" && detailModal.ticket.assigneeId === user.id && (
                  <>
                    {detailModal.ticket.status === "ASSIGNED" && (
                      <>
                        <button
                          onClick={() => handleStartProgress(detailModal.ticket.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Terima Tugas (Setuju)
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, ticketId: detailModal.ticket.id, reason: "" })}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Tolak Tugas
                        </button>
                      </>
                    )}

                    {detailModal.ticket.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => setResolveModal({ open: true, ticketId: detailModal.ticket.id, note: "" })}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Selesaikan Tiket
                      </button>
                    )}
                  </>
                )}

                {/* Admin Actions inside Modal */}
                {(user.role === "ADMIN" || user.role === "SUPERADMIN") && (
                  <>
                    {detailModal.ticket.status === "PENDING" && (
                      <button
                        onClick={() => {
                          fetch("/api/admin/employees")
                            .then((res) => res.json())
                            .then((res) => res.success && setEmployees(res.data));
                          setAssignModal({ open: true, ticketId: detailModal.ticket.id, assigneeId: "" });
                        }}
                        className="px-4 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5" />
                        Tugaskan Petugas
                      </button>
                    )}

                    {detailModal.ticket.status === "RESOLVED" && (
                      <button
                        onClick={() => handleCloseTicket(detailModal.ticket.id)}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Tutup Tiket Resmi
                      </button>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => setDetailModal({ open: false, ticket: null })}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TOLAK TIKET (WAJIB ALASAN) */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Tolak Tiket Pengaduan</h3>
            </div>
            <p className="text-xs text-slate-600">
              Penolakan tiket wajib menyertakan alasan jelas. Tiket akan otomatis dialihkan oleh sistem round-robin ke staf siaga berikutnya.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penolakan * (Minimal 5 karakter)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Sedang menangani unit emergensi di lokasi lain / sparepart tidak ready..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, ticketId: "", reason: "" })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRejectTicket}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELESAIKAN TIKET */}
      {resolveModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              Selesaikan Tiket Pengaduan
            </h3>
            <p className="text-xs text-slate-600">
              Berikan rangkuman tindakan dan hasil penanganan yang telah dilakukan untuk catatan pengadu & sistem.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Hasil Penanganan *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Pembersihan probe sampel berhasil, running kalibrasi normal dan hasil kontrol masuk rentang..."
                value={resolveModal.note}
                onChange={(e) => setResolveModal({ ...resolveModal, note: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setResolveModal({ open: false, ticketId: "", note: "" })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResolveTicket}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Selesaikan Tiket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL ASSIGN */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Tugaskan Tiket Secara Manual</h3>
            <p className="text-xs text-slate-600">
              Pilih staf teknisi atau IT yang akan menangani tiket ini.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Staf</label>
              <select
                value={assignModal.assigneeId}
                onChange={(e) => setAssignModal({ ...assignModal, assigneeId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-ssm-blue"
              >
                <option value="">-- Pilih Staf --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.division}) - {emp.phone || "No HP kosong"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setAssignModal({ open: false, ticketId: "", assigneeId: "" })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleManualAssign}
                className="px-4 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold"
              >
                Tugaskan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JADWAL */}
      {scheduleModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddSchedule} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Tambah Jadwal Siaga Karyawan</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
              <select
                required
                value={scheduleModal.userId}
                onChange={(e) => setScheduleModal({ ...scheduleModal, userId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.division})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Daerah Jaga</label>
              <select
                required
                value={scheduleModal.regionId}
                onChange={(e) => setScheduleModal({ ...scheduleModal, regionId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mulai</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleModal.startTime}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleModal.endTime}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
              <input
                type="text"
                value={scheduleModal.notes}
                onChange={(e) => setScheduleModal({ ...scheduleModal, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setScheduleModal({ ...scheduleModal, open: false })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold"
              >
                Simpan Jadwal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH / UBAH DAERAH */}
      {regionModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveRegion} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">
              {regionModal.isEdit ? "Ubah Data Daerah" : "Tambah Master Daerah Baru"}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Daerah *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Priangan Timur"
                value={regionModal.name}
                onChange={(e) => setRegionModal({ ...regionModal, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rincian Cakupan Wilayah *</label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Kota Tasikmalaya, Kab. Tasikmalaya, Ciamis, Banjar, Pangandaran, Garut"
                value={regionModal.coverage}
                onChange={(e) => setRegionModal({ ...regionModal, coverage: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRegionModal({ open: false, isEdit: false, name: "", coverage: "" })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH / UBAH PENGGUNA */}
      {userModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveUser} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">
              {userModal.isEdit ? "Ubah Data Pengguna" : "Tambah Akun Pengguna Baru"}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                placeholder="Nama Staf"
                value={userModal.name}
                onChange={(e) => setUserModal({ ...userModal, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            {!userModal.isEdit && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="staf@sabaraya.id"
                  value={userModal.email}
                  onChange={(e) => setUserModal({ ...userModal, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {userModal.isEdit ? "Reset Kata Sandi (Kosongkan jika tidak diubah)" : "Kata Sandi Awal *"}
              </label>
              <input
                type="password"
                required={!userModal.isEdit}
                placeholder={userModal.isEdit ? "Minimal 6 karakter..." : "Minimal 6 karakter"}
                value={userModal.password}
                onChange={(e) => setUserModal({ ...userModal, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role) *</label>
                <select
                  value={userModal.role}
                  onChange={(e) => setUserModal({ ...userModal, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                >
                  <option value="EMPLOYEE">Karyawan</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {userModal.role === "EMPLOYEE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Divisi *</label>
                  <select
                    value={userModal.division}
                    onChange={(e) => setUserModal({ ...userModal, division: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  >
                    <option value="TEKNISI">TEKNISI</option>
                    <option value="IT">IT</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={userModal.phone}
                  onChange={(e) => setUserModal({ ...userModal, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batas Maks Tiket</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={userModal.maxActiveTickets}
                  onChange={(e) => setUserModal({ ...userModal, maxActiveTickets: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setUserModal({ ...userModal, open: false })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold"
              >
                {userModal.isEdit ? "Perbarui Pengguna" : "Buat Akun"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />

      {/* AI Live CS Queue Modal */}
      <LiveChatQueueModal
        isOpen={liveChatModalOpen}
        onClose={() => setLiveChatModalOpen(false)}
        currentUser={user}
      />

      {/* AI Knowledge Base RAG Modal */}
      <KnowledgeBaseModal
        isOpen={knowledgeModalOpen}
        onClose={() => setKnowledgeModalOpen(false)}
      />
    </div>
  );
}

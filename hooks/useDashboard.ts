"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useDashboard() {
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

  // Action Modals
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
    role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
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

  // Load Data
  const loadData = useCallback(() => {
    if (!user) return;

    if (activeTab === "tickets") {
      let url = `/api/tickets?status=${statusFilter}&division=${divisionFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      fetch(url)
        .then((res) => res.json())
        .then((res) => res.success && setTickets(res.data));
    } else if (activeTab === "schedules") {
      fetch("/api/admin/schedules")
        .then((res) => res.json())
        .then((res) => res.success && setSchedules(res.data));
      fetch("/api/admin/employees")
        .then((res) => res.json())
        .then((res) => res.success && setEmployees(res.data));
      fetch("/api/admin/regions")
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
  }, [user, activeTab, statusFilter, divisionFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh employees list (for assign modal)
  const refreshEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (data.success) setEmployees(data.data);
    } catch {
      // silent
    }
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/masuk");
    } catch {
      toast.error("Gagal logout.");
    }
  };

  // Ticket Operations
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

  // Schedule Operations
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

  // Region Operations
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

  // User Operations
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

  return {
    user,
    loading,
    activeTab,
    setActiveTab,
    tickets,
    schedules,
    regions,
    usersList,
    employees,
    statusFilter,
    setStatusFilter,
    divisionFilter,
    setDivisionFilter,
    searchQuery,
    setSearchQuery,
    liveChatModalOpen,
    setLiveChatModalOpen,
    knowledgeModalOpen,
    setKnowledgeModalOpen,
    confirmModal,
    setConfirmModal,
    detailModal,
    setDetailModal,
    rejectModal,
    setRejectModal,
    resolveModal,
    setResolveModal,
    assignModal,
    setAssignModal,
    runningAutoAssign,
    scheduleModal,
    setScheduleModal,
    regionModal,
    setRegionModal,
    userModal,
    setUserModal,
    loadData,
    refreshEmployees,
    handleLogout,
    handleStartProgress,
    handleResolveTicket,
    handleRejectTicket,
    handleManualAssign,
    handleCloseTicket,
    handleTriggerAutoAssign,
    handleAddSchedule,
    handleDeleteSchedule,
    handleSaveRegion,
    handleToggleRegion,
    handleDeleteRegion,
    handleSaveUser,
    handleToggleUser,
    handleDeleteUser,
  };
}

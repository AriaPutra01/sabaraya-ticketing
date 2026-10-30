"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TicketsTab } from "@/components/dashboard/TicketsTab";
import { SchedulesTab } from "@/components/dashboard/SchedulesTab";
import { RegionsTab } from "@/components/dashboard/RegionsTab";
import { UsersTab } from "@/components/dashboard/UsersTab";
import { TicketDetailModal } from "@/components/dashboard/TicketDetailModal";
import {
  RejectTicketModal,
  ResolveTicketModal,
  AssignTicketModal,
} from "@/components/dashboard/TicketActionModals";
import { ScheduleModal } from "@/components/dashboard/ScheduleModal";
import { RegionModal } from "@/components/dashboard/RegionModal";
import { UserModal } from "@/components/dashboard/UserModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LiveChatQueueModal } from "@/components/dashboard/LiveChatQueueModal";
import { KnowledgeBaseModal } from "@/components/dashboard/KnowledgeBaseModal";
import { toast } from "sonner";

export default function DashboardPage() {
  const d = useDashboard();

  if (d.loading) {
    return (
      <div className="text-center py-20 text-slate-500 font-medium">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <DashboardHeader
        user={d.user}
        activeTab={d.activeTab}
        onTabChange={d.setActiveTab}
        onLogout={d.handleLogout}
        onRefresh={d.loadData}
        onOpenLiveChat={() => d.setLiveChatModalOpen(true)}
        onOpenKnowledge={() => d.setKnowledgeModalOpen(true)}
      />

      {/* TAB 1: TICKETS */}
      {d.activeTab === "tickets" && (
        <TicketsTab
          tickets={d.tickets}
          user={d.user}
          searchQuery={d.searchQuery}
          onSearchChange={d.setSearchQuery}
          statusFilter={d.statusFilter}
          onStatusFilterChange={d.setStatusFilter}
          divisionFilter={d.divisionFilter}
          onDivisionFilterChange={d.setDivisionFilter}
          onResetFilter={() => {
            d.setSearchQuery("");
            d.setStatusFilter("ALL");
            d.setDivisionFilter("ALL");
          }}
          runningAutoAssign={d.runningAutoAssign}
          onTriggerAutoAssign={d.handleTriggerAutoAssign}
          onOpenDetail={(ticket) => d.setDetailModal({ open: true, ticket })}
          onStartProgress={d.handleStartProgress}
          onOpenReject={(ticketId) => d.setRejectModal({ open: true, ticketId, reason: "" })}
          onOpenResolve={(ticketId) => d.setResolveModal({ open: true, ticketId, note: "" })}
          onOpenAssign={(ticketId) => {
            d.refreshEmployees();
            d.setAssignModal({ open: true, ticketId, assigneeId: "" });
          }}
          onCloseTicket={d.handleCloseTicket}
        />
      )}

      {/* TAB 2: SCHEDULES */}
      {d.activeTab === "schedules" && (
        <SchedulesTab
          schedules={d.schedules}
          onOpenAdd={() => {
            if (d.employees.length > 0 && d.regions.length > 0) {
              d.setScheduleModal({
                open: true,
                userId: d.employees[0].id,
                regionId: d.regions[0].id,
                startTime: "",
                endTime: "",
                notes: "Jadwal Siaga Reguler",
              });
            } else {
              toast.error("Pastikan data karyawan dan daerah sudah tersedia.");
            }
          }}
          onDelete={d.handleDeleteSchedule}
        />
      )}

      {/* TAB 3: REGIONS */}
      {d.activeTab === "regions" && (
        <RegionsTab
          regions={d.regions}
          onOpenAdd={() =>
            d.setRegionModal({
              open: true,
              isEdit: false,
              name: "",
              coverage: "",
            })
          }
          onOpenEdit={(r) =>
            d.setRegionModal({
              open: true,
              isEdit: true,
              id: r.id,
              name: r.name,
              coverage: r.coverage,
            })
          }
          onToggleActive={d.handleToggleRegion}
          onDelete={d.handleDeleteRegion}
        />
      )}

      {/* TAB 4: USERS (SUPERADMIN ONLY) */}
      {d.activeTab === "users" && d.user.role === "SUPERADMIN" && (
        <UsersTab
          usersList={d.usersList}
          currentUserId={d.user.id}
          onOpenAdd={() =>
            d.setUserModal({
              open: true,
              isEdit: false,
              name: "",
              email: "",
              password: "",
              role: "EMPLOYEE",
              division: "TEKNISI",
              phone: "",
              maxActiveTickets: 5,
            })
          }
          onOpenEdit={(u) =>
            d.setUserModal({
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
            })
          }
          onToggleActive={d.handleToggleUser}
          onDelete={d.handleDeleteUser}
        />
      )}

      {/* MODALS */}
      <TicketDetailModal
        isOpen={d.detailModal.open}
        ticket={d.detailModal.ticket}
        currentUser={d.user}
        onClose={() => d.setDetailModal({ open: false, ticket: null })}
        onStartProgress={d.handleStartProgress}
        onOpenReject={(ticketId) => d.setRejectModal({ open: true, ticketId, reason: "" })}
        onOpenResolve={(ticketId) => d.setResolveModal({ open: true, ticketId, note: "" })}
        onOpenAssign={(ticketId) => {
          d.refreshEmployees();
          d.setAssignModal({ open: true, ticketId, assigneeId: "" });
        }}
        onCloseTicket={d.handleCloseTicket}
      />

      <RejectTicketModal
        isOpen={d.rejectModal.open}
        reason={d.rejectModal.reason}
        onChangeReason={(reason) => d.setRejectModal((prev) => ({ ...prev, reason }))}
        onClose={() => d.setRejectModal({ open: false, ticketId: "", reason: "" })}
        onSubmit={d.handleRejectTicket}
      />

      <ResolveTicketModal
        isOpen={d.resolveModal.open}
        note={d.resolveModal.note}
        onChangeNote={(note) => d.setResolveModal((prev) => ({ ...prev, note }))}
        onClose={() => d.setResolveModal({ open: false, ticketId: "", note: "" })}
        onSubmit={d.handleResolveTicket}
      />

      <AssignTicketModal
        isOpen={d.assignModal.open}
        assigneeId={d.assignModal.assigneeId}
        employees={d.employees}
        onChangeAssignee={(assigneeId) => d.setAssignModal((prev) => ({ ...prev, assigneeId }))}
        onClose={() => d.setAssignModal({ open: false, ticketId: "", assigneeId: "" })}
        onSubmit={d.handleManualAssign}
      />

      <ScheduleModal
        isOpen={d.scheduleModal.open}
        schedule={d.scheduleModal}
        employees={d.employees}
        regions={d.regions}
        onChange={(fields) => d.setScheduleModal((prev) => ({ ...prev, ...fields }))}
        onClose={() => d.setScheduleModal((prev) => ({ ...prev, open: false }))}
        onSubmit={d.handleAddSchedule}
      />

      <RegionModal
        isOpen={d.regionModal.open}
        region={d.regionModal}
        onChange={(fields) => d.setRegionModal((prev) => ({ ...prev, ...fields }))}
        onClose={() => d.setRegionModal((prev) => ({ ...prev, open: false }))}
        onSubmit={d.handleSaveRegion}
      />

      <UserModal
        isOpen={d.userModal.open}
        user={d.userModal}
        onChange={(fields) => d.setUserModal((prev) => ({ ...prev, ...fields }))}
        onClose={() => d.setUserModal((prev) => ({ ...prev, open: false }))}
        onSubmit={d.handleSaveUser}
      />

      <ConfirmModal
        isOpen={d.confirmModal.open}
        onClose={() => d.setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={d.confirmModal.onConfirm}
        title={d.confirmModal.title}
        message={d.confirmModal.message}
        variant={d.confirmModal.variant}
        confirmText={d.confirmModal.confirmText}
      />

      <LiveChatQueueModal
        isOpen={d.liveChatModalOpen}
        onClose={() => d.setLiveChatModalOpen(false)}
        currentUser={d.user}
      />

      <KnowledgeBaseModal
        isOpen={d.knowledgeModalOpen}
        onClose={() => d.setKnowledgeModalOpen(false)}
      />
    </div>
  );
}

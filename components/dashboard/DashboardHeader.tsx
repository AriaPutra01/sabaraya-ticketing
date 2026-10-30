"use client";

import React from "react";
import {
  LogOut,
  Ticket,
  Calendar,
  MapPin,
  Users,
  MessageSquare,
  BookOpen,
  RefreshCw,
} from "lucide-react";

interface DashboardHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "SUPERADMIN" | "ADMIN" | "EMPLOYEE";
    division?: string | null;
    phone?: string | null;
  };
  activeTab: "tickets" | "schedules" | "regions" | "users";
  onTabChange: (tab: "tickets" | "schedules" | "regions" | "users") => void;
  onLogout: () => void;
  onRefresh: () => void;
  onOpenLiveChat: () => void;
  onOpenKnowledge: () => void;
}

export function DashboardHeader({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onRefresh,
  onOpenLiveChat,
  onOpenKnowledge,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Banner / User Profile */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-ssm-blue text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {user.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ssm-blue-light text-ssm-blue">
                {user.role} {user.division ? `• ${user.division}` : ""}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {user.email} • {user.phone || "No HP belum diisi"}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onTabChange("tickets")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
            activeTab === "tickets"
              ? "bg-ssm-blue text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ticket className="w-4 h-4 shrink-0" />
          Daftar Tiket
        </button>

        {["SUPERADMIN", "ADMIN"].includes(user.role) && (
          <>
            <button
              onClick={() => onTabChange("schedules")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
                activeTab === "schedules"
                  ? "bg-ssm-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              Jadwal Siaga
            </button>

            <button
              onClick={() => onTabChange("regions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
                activeTab === "regions"
                  ? "bg-ssm-blue text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              Master Daerah
            </button>
          </>
        )}

        {user.role === "SUPERADMIN" && (
          <button
            onClick={() => onTabChange("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 ${
              activeTab === "users"
                ? "bg-ssm-blue text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Kelola Pengguna
          </button>
        )}

        <button
          onClick={onOpenLiveChat}
          className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition whitespace-nowrap shrink-0"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Antrean Live CS</span>
        </button>

        {["ADMIN", "SUPERADMIN"].includes(user.role) && (
          <button
            onClick={onOpenKnowledge}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-ssm-blue-light/60 hover:bg-ssm-blue-light text-ssm-blue border border-ssm-blue/20 transition whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Basis Pengetahuan AI</span>
          </button>
        )}

        <button
          onClick={onRefresh}
          className="ml-auto p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition shrink-0"
          title="Segarkan Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

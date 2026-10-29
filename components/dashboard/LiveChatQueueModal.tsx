"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, RefreshCw, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface ChatSessionItem {
  id: string;
  userName: string | null;
  userContact: string | null;
  status: "BOT_ACTIVE" | "WAITING_FOR_AGENT" | "AGENT_ACTIVE" | "CLOSED";
  assignedTo?: { id: string; name: string; division?: string } | null;
  ticket?: {
    id: string;
    code: string;
    title: string;
    institutionName: string;
    status: string;
    priority: string;
  } | null;
  updatedAt: string;
  sessionToken?: string;
  messages: Array<{ content: string; createdAt: string; sender: string }>;
}

export function LiveChatQueueModal({
  isOpen,
  onClose,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; role: string; division?: string | null };
}) {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSessionItem | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filterTab, setFilterTab] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [deleteConfirmSession, setDeleteConfirmSession] = useState<ChatSessionItem | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Ambil daftar antrean
  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/chat-queue${filterTab === "ALL" ? "?status=ALL" : ""}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      toast.error("Gagal memuat antrean chat");
    } finally {
      setIsLoading(false);
    }
  }, [filterTab]);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;

    const load = () => {
      fetch(`/api/admin/chat-queue${filterTab === "ALL" ? "?status=ALL" : ""}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!ignore && data?.sessions) {
            setSessions(data.sessions);
          }
        })
        .catch(() => {});
    };

    load();
    const pusher = getPusherClient();
    const intervalTime = pusher ? 15000 : 5000;
    const interval = setInterval(load, intervalTime);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [isOpen, filterTab]);

  // Muat detail pesan sesi yang dipilih
  const selectSession = async (session: ChatSessionItem) => {
    setSelectedSession(session);
    try {
      const sRes = await fetch(`/api/chat/session?id=${session.id}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setMessages(sData.session?.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Realtime subscription untuk sesi yang sedang dibuka
  useEffect(() => {
    if (!selectedSession?.id) return;

    const pusher = getPusherClient();
    let channel: any = null;

    if (pusher) {
      channel = pusher.subscribe(`chat-${selectedSession.id}`);
      channel.bind("new-message", (msg: any) => {
        setMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
      channel.bind("status-changed", (data: any) => {
        setSelectedSession((prev) => (prev ? { ...prev, status: data.status } : null));
        fetchQueue();
      });
    }

    return () => {
      if (pusher && channel) {
        pusher.unsubscribe(`chat-${selectedSession.id}`);
      }
    };
  }, [selectedSession?.id, fetchQueue]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ambil alih percakapan
  const handleTakeover = async (session: ChatSessionItem) => {
    try {
      const res = await fetch(`/api/admin/chat-queue/${session.id}/takeover`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Berhasil mengambil alih percakapan!");
        setSelectedSession(data.session);
        selectSession(data.session);
        fetchQueue();
      } else {
        toast.error("Gagal mengambil alih percakapan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  // Kirim balasan staf
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession || isSending) return;

    const text = replyText.trim();
    setReplyText("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          content: text,
        }),
      });

      if (!res.ok) {
        toast.error("Gagal mengirim balasan");
      }
    } catch {
      toast.error("Terjadi kesalahan pengiriman");
    } finally {
      setIsSending(false);
    }
  };

  // Tutup sesi percakapan
  const handleCloseSession = async () => {
    if (!selectedSession) return;

    try {
      const res = await fetch(`/api/admin/chat-queue/${selectedSession.id}/takeover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLOSE" }),
      });
      if (res.ok) {
        toast.success("Sesi chat berhasil ditutup");
        setSelectedSession(null);
        fetchQueue();
      }
    } catch {
      toast.error("Gagal menutup sesi");
    }
  };

  // Hapus sesi chat permanen (Hanya Admin & Superadmin)
  const handleDeleteSession = async () => {
    if (!deleteConfirmSession) return;

    try {
      const res = await fetch(`/api/admin/chat-queue/${deleteConfirmSession.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Sesi chat berhasil dihapus.");
        if (selectedSession?.id === deleteConfirmSession.id) {
          setSelectedSession(null);
          setMessages([]);
        }
        fetchQueue();
      } else {
        toast.error(data.error || "Gagal menghapus sesi");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ssm-blue flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Antrean Live CS & Chatbot</h2>
              <p className="text-xs text-slate-300">
                Layanan pelanggan interaktif & penanganan eskalasi chat staf
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten 2 Kolom */}
        <div className="flex-1 flex overflow-hidden">
          {/* Kolom Kiri: Daftar Antrean */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
            {/* Filter Tab Antrean */}
            <div className="p-2 border-b border-slate-200 flex items-center gap-1.5 bg-white">
              <button
                onClick={() => setFilterTab("ACTIVE")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  filterTab === "ACTIVE"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Butuh Staf
              </button>
              <button
                onClick={() => setFilterTab("ALL")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  filterTab === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua ({sessions.length})
              </button>
              <button
                onClick={fetchQueue}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Segarkan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
              {sessions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {filterTab === "ACTIVE"
                    ? "Tidak ada antrean live chat yang butuh respons staf saat ini."
                    : "Tidak ada riwayat sesi chat."}
                </div>
              ) : (
                sessions.map((s) => {
                  const isSelected = selectedSession?.id === s.id;
                  const isWaiting = s.status === "WAITING_FOR_AGENT";
                  const isActive = s.status === "AGENT_ACTIVE";

                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSession(s)}
                      className={`p-3.5 cursor-pointer transition ${
                        isSelected
                          ? "bg-ssm-blue-light/60 border-l-4 border-ssm-blue"
                          : "hover:bg-slate-100/70"
                      }`}
                    >
                      {/* Ticket Badge */}
                      {s.ticket ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-ssm-blue bg-ssm-blue-light px-2 py-0.5 rounded-md mb-1.5 w-fit">
                          <Ticket className="w-3 h-3 text-ssm-blue shrink-0" />
                          <span>{s.ticket.code}</span>
                          <span className="text-slate-400 font-normal">•</span>
                          <span className="truncate max-w-32 font-medium">{s.ticket.institutionName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium block mb-1">
                          Pengadu Tamu (Publik)
                        </span>
                      )}

                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {s.userName || (s.ticket ? s.ticket.institutionName : "Pengadu Tamu")}
                        </span>
                        {isWaiting && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                            Butuh Staf
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ssm-blue-light text-ssm-blue">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">
                        {s.messages?.[0]?.content || "Tidak ada preview pesan"}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {s.assignedTo ? `Ditangani: ${s.assignedTo.name}` : "Menunggu klaim"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kolom Kanan: Detail Percakapan & Respon */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedSession ? (
              <>
                {/* Header Sesi Terpilih */}
                <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    {selectedSession.ticket && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-ssm-blue mb-0.5">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Tiket: {selectedSession.ticket.code} ({selectedSession.ticket.institutionName})</span>
                      </div>
                    )}
                    <h3 className="font-bold text-sm text-slate-900">
                      {selectedSession.userName || (selectedSession.ticket ? selectedSession.ticket.institutionName : "Pengadu Tamu")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Status:{" "}
                      <span className="font-medium text-slate-700">
                        {selectedSession.status}
                      </span>{" "}
                      {selectedSession.assignedTo && `• Petugas: ${selectedSession.assignedTo.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSession.status === "WAITING_FOR_AGENT" && (
                      <button
                        onClick={() => handleTakeover(selectedSession)}
                        className="px-3 py-1.5 rounded-lg bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-semibold shadow-xs transition"
                      >
                        Ambil Alih Chat
                      </button>
                    )}
                    {selectedSession.status === "AGENT_ACTIVE" && (
                      <button
                        onClick={() => setCloseConfirmOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-amber-100 hover:text-amber-800 text-slate-700 text-xs font-semibold transition"
                      >
                        Tutup Sesi
                      </button>
                    )}
                    {(currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN") && (
                      <button
                        onClick={() => setDeleteConfirmSession(selectedSession)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-ssm-red hover:bg-ssm-red-light transition"
                        title="Hapus Sesi Chat Permanen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Riwayat Pesan */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-sm">
                  {messages.map((m, idx) => {
                    const isStaff = m.sender === "AGENT";
                    const isUser = m.sender === "USER";
                    const isSystem = m.sender === "SYSTEM";

                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-2">
                          <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs max-w-[85%] text-center">
                            {m.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                          {isStaff ? "Anda (Staf CS)" : isUser ? "Pengadu" : "Sabaraya Bot"}
                        </span>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 leading-relaxed shadow-xs ${
                            isStaff
                              ? "bg-slate-900 text-white rounded-br-xs"
                              : isUser
                              ? "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                              : "bg-ssm-blue-light/50 text-slate-900 border border-ssm-blue/20 rounded-bl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Form Kirim Balasan */}
                {selectedSession.status === "AGENT_ACTIVE" ? (
                  <form
                    onSubmit={handleSendReply}
                    className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Ketik balasan Anda ke pengadu..."
                      className="flex-1 px-4 py-2.5 text-sm bg-slate-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-ssm-blue"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !replyText.trim()}
                      className="px-4 py-2.5 bg-ssm-blue hover:bg-ssm-blue-hover text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    >
                      Kirim
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
                    {selectedSession.status === "WAITING_FOR_AGENT"
                      ? 'Klik "Ambil Alih Chat" di kanan atas untuk mulai membalas pengadu.'
                      : "Sesi ini tidak dalam status aktif dengan agen."}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-sm">Pilih salah satu sesi di kolom kiri untuk melihat riwayat pesan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal: Tutup Sesi */}
      <ConfirmModal
        isOpen={closeConfirmOpen}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={handleCloseSession}
        title="Tutup Sesi Percakapan?"
        message="Sesi live chat akan ditandai selesai. Pengguna tetap dapat melihat riwayat namun tidak dapat mengirim balasan baru."
        confirmText="Tutup Sesi"
        variant="warning"
      />

      {/* Confirm Modal: Hapus Sesi Permanen */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmSession)}
        onClose={() => setDeleteConfirmSession(null)}
        onConfirm={handleDeleteSession}
        title="Hapus Sesi Chat Permanen?"
        message="Semua riwayat percakapan pada sesi ini akan dihapus permanen dari sistem dan tidak dapat dipulihkan."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}

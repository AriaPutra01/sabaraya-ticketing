"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, Bot, UserCheck, Clock, RefreshCw, ChevronDown } from "lucide-react";
import { getPusherClient } from "@/lib/pusher";

interface Message {
  id?: string;
  sender: "USER" | "BOT" | "AGENT" | "SYSTEM";
  senderName?: string;
  content: string;
  createdAt?: string;
}

interface ChatSessionData {
  id: string;
  sessionToken: string;
  status: "BOT_ACTIVE" | "WAITING_FOR_AGENT" | "AGENT_ACTIVE" | "CLOSED";
  assignedTo?: { id: string; name: string; division?: string } | null;
  ticket?: {
    code: string;
    institutionName: string;
    status: string;
  } | null;
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTicketCode, setActiveTicketCode] = useState<string | null>(null);
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateForm, setEscalateForm] = useState({ name: "", institution: "", phone: "" });
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset sesi chat aktif dan kembali ke sambutan awal
  const handleStartNewChat = () => {
    localStorage.removeItem("sbr_chat_token");
    setSession(null);
    setActiveTicketCode(null);
    setShowEscalateForm(false);
    setEscalateForm({ name: "", institution: "", phone: "" });
    setMessages([
      {
        sender: "BOT",
        content: "Halo! Saya Sabaraya AI Assistant. Ada yang bisa saya bantu terkait layanan pengaduan tiket atau kendala teknis alat?",
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  // Helper mendapatkan atau membuat token chat unik lokal
  const getOrCreateToken = (): string => {
    let token = localStorage.getItem("sbr_chat_token");
    if (!token) {
      token = "sbr_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("sbr_chat_token", token);
    }
    return token;
  };

  // Fungsi membuat atau mengambil sesi secara on-demand HANYA jika ada tiket atau eskalasi
  const ensureSession = useCallback(async (ticketCodeToLink?: string): Promise<ChatSessionData | null> => {
    const token = getOrCreateToken();
    const targetCode = ticketCodeToLink || activeTicketCode;

    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ticketCode: targetCode || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        if (data.session.messages && data.session.messages.length > 0) {
          setMessages(data.session.messages);
        }
        return data.session;
      }
    } catch (err) {
      console.error("Gagal sinkronisasi sesi chat:", err);
    }
    return null;
  }, [activeTicketCode]);

  // Submit pre-escalation gate untuk tamu tanpa tiket
  const handleSubmitEscalation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!escalateForm.name.trim() || !escalateForm.institution.trim() || isSubmittingEscalation) return;

    setIsSubmittingEscalation(true);
    const token = getOrCreateToken();

    try {
      const contactInfo = `${escalateForm.institution.trim()}${escalateForm.phone.trim() ? ` • Telp/WA: ${escalateForm.phone.trim()}` : ""}`;
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userName: escalateForm.name.trim(),
          userContact: contactInfo,
          status: "WAITING_FOR_AGENT",
          initialMessages: messages,
          escalationReason: "Permintaan bantuan staf langsung melalui widget CS",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setShowEscalateForm(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "SYSTEM",
            content: `Terima kasih Bapak/Ibu ${escalateForm.name}. Permintaan Anda telah kami teruskan ke antrean staf siaga PT Sabaraya Sagara Mandiri. Staf kami akan segera mengambil alih percakapan ini.`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Gagal eskalasi ke staf:", err);
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  // Muat sesi yang sudah ada saat widget dibuka (HANYA GET, tidak insert row kosong)
  useEffect(() => {
    if (!isOpen || session) return;

    let isCancelled = false;

    const checkExistingSession = async () => {
      const token = localStorage.getItem("sbr_chat_token");
      if (!token) {
        setMessages([
          {
            sender: "BOT",
            content: "Halo! Saya Sabaraya AI Assistant. Ada yang bisa saya bantu terkait layanan pengaduan tiket atau kendala teknis alat?",
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }

      try {
        const res = await fetch(`/api/chat/session?token=${token}`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (data.session) {
            setSession(data.session);
            if (data.session.messages && data.session.messages.length > 0) {
              setMessages(data.session.messages);
              return;
            }
          }
        }
      } catch {
        // Belum ada sesi di DB
      }

      if (!isCancelled) {
        setMessages([
          {
            sender: "BOT",
            content: "Halo! Saya Sabaraya AI Assistant. Ada yang bisa saya bantu terkait layanan pengaduan tiket atau kendala teknis alat?",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    checkExistingSession();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, session]);

  // Listener event eksternal: Buka chat terkait nomor tiket tertentu (Ticket-Centric)
  useEffect(() => {
    const handleOpenTicketChat = async (e: Event) => {
      const customEvent = e as CustomEvent<{ ticketCode?: string }>;
      const code = customEvent.detail?.ticketCode;
      setIsOpen(true);
      if (code) {
        setActiveTicketCode(code);
        await ensureSession(code);
      }
    };

    window.addEventListener("open-ticket-chat", handleOpenTicketChat);
    return () => {
      window.removeEventListener("open-ticket-chat", handleOpenTicketChat);
    };
  }, [activeTicketCode, ensureSession]);

  // Sinkronisasi realtime & fallback polling hanya saat widget aktif
  useEffect(() => {
    if (!isOpen || !session?.id) return;
    if (session.status !== "WAITING_FOR_AGENT" && session.status !== "AGENT_ACTIVE") return;

    const pusher = getPusherClient();
    let channel: any = null;

    if (pusher) {
      channel = pusher.subscribe(`chat-${session.id}`);

      channel.bind("new-message", (msg: Message) => {
        setMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      channel.bind("status-changed", (data: { status: ChatSessionData["status"] }) => {
        setSession((prev) => (prev ? { ...prev, status: data.status } : null));
      });

      channel.bind("agent-joined", (data: { agentName: string; division?: string; status: ChatSessionData["status"] }) => {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                assignedTo: { id: "agent", name: data.agentName, division: data.division },
              }
            : null
        );
      });
    }

    // Polling fallback saat menunggu atau aktif dengan agen (lebih hemat jika pusher aktif)
    const pollInterval = setInterval(async () => {
      if (!session?.sessionToken || session.status === "CLOSED") return;
      try {
        const res = await fetch(`/api/chat/session?token=${session.sessionToken}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setSession((prev) => ({
              ...prev,
              status: data.session.status,
              assignedTo: data.session.assignedTo,
              id: data.session.id,
              sessionToken: data.session.sessionToken,
              ticket: data.session.ticket,
            }));
            if (data.session.messages) {
              setMessages(data.session.messages);
            }
          }
        }
      } catch {
        // Silent catch
      }
    }, pusher ? 12000 : 4000);

    return () => {
      if (pusher && channel) {
        pusher.unsubscribe(`chat-${session.id}`);
      }
      clearInterval(pollInterval);
    };
  }, [isOpen, session?.id, session?.sessionToken, session?.status]);

  // Scroll otomatis ke bawah
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Kirim pesan
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    // Optimistic message update untuk pengguna
    const userMsg: Message = {
      sender: "USER",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const isBotActive = !session || session.status === "BOT_ACTIVE";

      if (isBotActive) {
        const payloadMessages = [
          ...messages
            .filter((m) => m.sender === "USER" || m.sender === "BOT")
            .map((m) => ({
              role: m.sender === "USER" ? ("user" as const) : ("assistant" as const),
              content: m.content,
            })),
          { role: "user" as const, content: text },
        ];

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            sessionId: session?.id,
            token: session?.sessionToken,
            ticketCode: session?.ticket?.code || activeTicketCode || undefined,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          if (errData.status && session) {
            setSession((prev) => (prev ? { ...prev, status: errData.status } : null));
          }
          throw new Error(errData.error || "Gagal memproses pesan");
        }

        // Tampilkan placeholder bot message untuk diisi secara streaming
        setMessages((prev) => [
          ...prev,
          { sender: "BOT", content: "", createdAt: new Date().toISOString() },
        ]);

        // Baca streaming text delta secara real-time
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let botReply = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            botReply += decoder.decode(value, { stream: true });
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last && last.sender === "BOT") {
                last.content = botReply;
              }
              return next;
            });
          }

          // Otomatis buka form pre-eskalasi jika asisten meminta identitas / tamu belum terdaftar
          if (!session && (botReply.includes("formulir yang muncul") || botReply.includes("lengkapi nama dan instansi"))) {
            setShowEscalateForm(true);
          }
        }
      } else if (session?.id) {
        // Mode staf manusia aktif (AGENT_ACTIVE)
        await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            token: session.sessionToken,
            content: text,
          }),
        });
      }
    } catch (err: any) {
      console.error("Gagal kirim pesan:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "SYSTEM",
          content: "Mohon maaf, terjadi kendala saat mengirim pesan. Silakan coba lagi.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Tombol pintas eskalasi manual ke manusia
  const handleRequestHumanAgent = async () => {
    if (isLoading) return;

    // Jika sudah terikat tiket, langsung eskalasi karena identitas faskes sudah terverifikasi
    if (session?.ticket) {
      setIsLoading(true);

      try {
        const prompt = "Tolong hubungkan saya langsung dengan staf customer service manusia sekarang.";
        setInput("");
        setMessages((prev) => [
          ...prev,
          { sender: "USER", content: prompt, createdAt: new Date().toISOString() },
        ]);

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            sessionId: session.id,
            token: session.sessionToken,
            ticketCode: session.ticket.code,
          }),
        });

        if (res.ok) {
          setTimeout(async () => {
            const sRes = await fetch(`/api/chat/session?token=${session.sessionToken}`);
            if (sRes.ok) {
              const data = await sRes.json();
              if (data.session) {
                setSession(data.session);
                setMessages(data.session.messages || []);
              }
            }
          }, 1200);
        }
      } catch (e) {
        console.error("Gagal eskalasi manual:", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Jika tamu belum punya tiket/identitas, tampilkan pre-escalation gate
      setShowEscalateForm(true);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50">
      {/* Tombol Melayang Saat Widget Ditutup */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-ssm-blue hover:bg-ssm-blue-hover text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
          aria-label="Buka Chat Customer Service"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xs pr-1 hidden sm:inline">
            CS & AI Support
          </span>
        </button>
      )}

      {/* Jendela Chat Terbuka */}
      {isOpen && (
        <div className="w-[calc(100vw-1.5rem)] sm:w-96 h-125 max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-ssm-blue flex items-center justify-center text-white">
                {session?.status === "AGENT_ACTIVE" ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">
                  {session?.status === "AGENT_ACTIVE"
                    ? session.assignedTo?.name || "Staf CS Sabaraya"
                    : "Sabaraya AI Assistant"}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                  {(!session || session.status === "BOT_ACTIVE") && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Online (AI Support)</span>
                    </>
                  )}
                  {session?.status === "WAITING_FOR_AGENT" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Menunggu Petugas...</span>
                    </>
                  )}
                  {session?.status === "AGENT_ACTIVE" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-ssm-blue" />
                      <span>Terhubung Langsung</span>
                    </>
                  )}
                  {session?.status === "CLOSED" && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Sesi Selesai</span>
                      <button
                        type="button"
                        onClick={handleStartNewChat}
                        className="ml-2 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition"
                      >
                        Mulai Baru
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Tutup Chat"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Banner Informasi Tiket jika Terhubung ke Tiket */}
          {session?.ticket && (
            <div className="bg-ssm-blue-light/60 border-b border-ssm-blue/20 px-3 py-1.5 text-[11px] text-slate-800 flex items-center justify-between">
              <span>Tiket: <strong className="text-ssm-blue">{session.ticket.code}</strong></span>
              <span className="px-1.5 py-0.5 rounded bg-ssm-blue-light text-ssm-blue font-semibold">{session.ticket.status}</span>
            </div>
          )}

          {/* Banner Status Menunggu Staf */}
          {session?.status === "WAITING_FOR_AGENT" && (
            <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
              <span>
                Permintaan dialihkan ke staf manusia. Petugas kami akan segera merespons di sini.
              </span>
            </div>
          )}

          {/* Area Pesan */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-sm">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "USER";
              const isSystem = msg.sender === "SYSTEM";

              if (isSystem) {
                return (
                  <div key={idx} className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs text-center max-w-[90%] leading-relaxed">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  {!isUser && (
                    <span className="text-[10px] font-medium text-slate-500 mb-1 px-1">
                      {msg.sender === "AGENT"
                        ? msg.senderName || session?.assignedTo?.name || "Staf CS"
                        : "Sabaraya AI"}
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-ssm-blue text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs p-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-ssm-blue" />
                <span>Mengetik jawaban...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Tombol Opsi Hubungkan ke Manusia */}
          {(!session || session?.status === "BOT_ACTIVE") && messages.length > 2 && !showEscalateForm && (
            <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleRequestHumanAgent}
                disabled={isLoading}
                className="text-xs text-ssm-blue hover:text-ssm-blue-hover font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                <span>Minta bantuan staf manusia</span>
                <span>→</span>
              </button>
            </div>
          )}

          {/* Inline Pre-Escalation Gate Form (Hanya saat tamu tanpa tiket meminta bantuan staf) */}
          {showEscalateForm && (
            <div className="p-3.5 bg-ssm-blue-light/70 border-t border-ssm-blue/20 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-ssm-blue">
                <UserCheck className="w-4 h-4" />
                <span>Identitas Pelapor untuk Staf Siaga</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Lengkapi identitas fasilitas kesehatan Anda agar staf teknisi/CS kami dapat melayani kendala dengan tepat:
              </p>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Nama Lengkap Anda *"
                  value={escalateForm.name}
                  onChange={(e) => setEscalateForm({ ...escalateForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-ssm-blue"
                />
                <input
                  type="text"
                  placeholder="Nama Faskes / Lab / RS *"
                  value={escalateForm.institution}
                  onChange={(e) => setEscalateForm({ ...escalateForm, institution: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-ssm-blue"
                />
                <input
                  type="tel"
                  placeholder="No. WhatsApp / Telepon Aktif (Opsional)"
                  value={escalateForm.phone}
                  onChange={(e) => setEscalateForm({ ...escalateForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-ssm-blue"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowEscalateForm(false)}
                  className="px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-200 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!escalateForm.name.trim() || !escalateForm.institution.trim() || isSubmittingEscalation}
                  onClick={handleSubmitEscalation}
                  className="px-3.5 py-1.5 rounded-xl bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-bold disabled:opacity-50 transition shadow-xs"
                >
                  {isSubmittingEscalation ? "Menghubungkan..." : "Hubungkan ke Staf"}
                </button>
              </div>
            </div>
          )}

          {/* Area Input Pesan atau Aksi Sesi Selesai */}
          {session?.status === "CLOSED" ? (
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">
                Sesi telah diselesaikan oleh petugas.
              </span>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ssm-blue hover:bg-ssm-blue-hover text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Mulai Chat Baru</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan Anda di sini..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-sm bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-ssm-blue focus:outline-none transition disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-ssm-blue hover:bg-ssm-blue-hover text-white rounded-xl shadow-xs transition disabled:opacity-50 disabled:hover:bg-ssm-blue"
                aria-label="Kirim Pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

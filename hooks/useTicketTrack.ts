"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function useTicketTrack() {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") || "";

  const [inputCode, setInputCode] = useState(queryCode);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);

  const searchTicket = useCallback(async (codeToSearch: string) => {
    if (!codeToSearch.trim()) {
      toast.error("Masukkan kode tiket.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/track?code=${encodeURIComponent(codeToSearch.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Tiket tidak ditemukan.");
        setActiveTicket(null);
      } else {
        setActiveTicket(data.data);
      }
    } catch {
      toast.error("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch("/api/tickets/track")
      .then((res) => res.json())
      .then((res) => {
        if (!ignore && res.success && res.mode === "history") {
          setHistoryTickets(res.data);
        }
      })
      .catch(() => {});

    if (queryCode) {
      const loadQueryTicket = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/tickets/track?code=${encodeURIComponent(queryCode.trim())}`);
          const data = await res.json();
          if (!ignore) {
            if (data.success) {
              setActiveTicket(data.data);
            } else {
              toast.error(data.message || "Tiket tidak ditemukan.");
              setActiveTicket(null);
            }
          }
        } catch {
          if (!ignore) toast.error("Gagal menghubungi server.");
        } finally {
          if (!ignore) setLoading(false);
        }
      };

      loadQueryTicket();
    }

    return () => {
      ignore = true;
    };
  }, [queryCode]);

  return {
    inputCode,
    setInputCode,
    loading,
    activeTicket,
    historyTickets,
    searchTicket,
  };
}

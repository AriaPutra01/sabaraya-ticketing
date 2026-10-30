"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, X, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
  _count: { chunks: number };
}

export function KnowledgeBaseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({
    open: false,
    id: "",
  });

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("FAQ");
  const [content, setContent] = useState("");

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      toast.error("Gagal memuat dokumen pengetahuan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    fetch("/api/admin/knowledge")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.documents) {
          setDocuments(data.documents);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan isi dokumen wajib diisi");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Dokumen berhasil disimpan (${data.totalChunks} potongan teks di-embed)`);
        setTitle("");
        setContent("");
        fetchDocs();
      } else {
        toast.error("Gagal menyimpan dokumen");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    try {
      const res = await fetch(`/api/admin/knowledge?id=${deleteModal.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Dokumen berhasil dihapus");
        fetchDocs();
      }
    } catch {
      toast.error("Gagal menghapus dokumen");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ssm-blue flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Basis Pengetahuan AI (RAG)</h2>
              <p className="text-xs text-slate-300">
                Kelola dokumen FAQ & panduan yang digunakan AI Chatbot untuk menjawab pertanyaan
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

        {/* Content Responsif */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* Kolom Kiri: Form Input Dokumen Baru */}
          <div className="w-full md:w-1/2 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50 shrink-0">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-ssm-blue" />
              <span>Tambah Dokumen Baru</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Prosedur Penggantian Reagen & Kalibrasi"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-ssm-blue focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-ssm-blue focus:outline-none"
                >
                  <option value="FAQ">FAQ & Alur Pengaduan</option>
                  <option value="TEKNISI">Panduan Teknisi & Alat Lab</option>
                  <option value="IT">Panduan IT & Bridging LIS</option>
                  <option value="OPERASIONAL">Jam Kerja & Layanan Garansi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Dokumen / Teks Panduan
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan materi atau penjelasan lengkap di sini. Teks akan otomatis dipotong (chunking) dan di-embed ke vektor database..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-ssm-blue focus:outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistem otomatis memecah teks ke dalam potongan optimal dan menyimpannya ke pgvector.
                </p>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 px-4 bg-ssm-blue hover:bg-ssm-blue-hover text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses & Embedding...</span>
                  </>
                ) : (
                  <span>Simpan & Chunking ke Vektor</span>
                )}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Daftar Dokumen yang Tersimpan */}
          <div className="w-full md:w-1/2 p-4 sm:p-5 overflow-y-auto bg-white flex flex-col flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Dokumen Tersimpan ({documents.length})
              </h3>
              <button
                onClick={fetchDocs}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="flex-1 space-y-3">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada dokumen pengetahuan. Tambahkan dokumen pertama Anda di formulir sebelah kiri.
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-ssm-blue-light text-ssm-blue border border-ssm-blue/20">
                          {doc.category}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">
                          {doc.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => setDeleteModal({ open: true, id: doc.id })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-ssm-red hover:bg-ssm-red-light transition"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3">
                      {doc.content}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>{doc._count.chunks} Vektor Chunks</span>
                      <span>Diperbarui: {new Date(doc.updatedAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: "" })}
        onConfirm={handleDelete}
        title="Hapus Dokumen Pengetahuan?"
        message="Dokumen ini beserta seluruh vektor chunk terkait akan dihapus permanen dari basis pengetahuan AI."
        confirmText="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}

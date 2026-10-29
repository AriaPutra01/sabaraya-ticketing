"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, RefreshCw } from "lucide-react";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "danger",
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-ssm-red-light text-ssm-red",
          icon: <Trash2 className="w-5 h-5" />,
          btn: "bg-ssm-red hover:bg-ssm-red-hover text-white shadow-xs",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
          icon: <AlertTriangle className="w-5 h-5" />,
          btn: "bg-amber-600 hover:bg-amber-700 text-white shadow-xs",
        };
      case "primary":
      default:
        return {
          iconBg: "bg-ssm-blue-light text-ssm-blue",
          icon: <AlertTriangle className="w-5 h-5" />,
          btn: "bg-ssm-blue hover:bg-ssm-blue-hover text-white shadow-xs",
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}>
              {currentVariant.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 ${currentVariant.btn}`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

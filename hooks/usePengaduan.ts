"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface RegionItem {
  id: string;
  name: string;
  coverage: string;
}

export function usePengaduan() {
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [successData, setSuccessData] = useState<{
    code: string;
    assigned: boolean;
    assigneeName: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    division: "TEKNISI",
    regionId: "",
    institutionName: "",
    reporterName: "",
    reporterPhone: "",
    reporterAddress: "",
    deviceBrand: "",
    serialNumber: "",
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setRegions(res.data);
          setFormData((prev) => ({ ...prev, regionId: res.data[0].id }));
        }
      })
      .catch(() => toast.error("Gagal memuat daftar wilayah."));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (photoUrls.length + selectedFiles.length > 3) {
      toast.error(`Maksimal 3 foto. Anda sudah mengunggah ${photoUrls.length} foto.`);
      e.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Foto "${file.name}" melebihi batas 5MB.`);
        e.target.value = "";
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`Format berkas "${file.name}" tidak didukung. Gunakan JPG, PNG, atau WEBP.`);
        e.target.value = "";
        return;
      }
    }

    setUploading(true);
    const toastId = toast.loading(`Menyiapkan unggah ${selectedFiles.length} foto ke Cloudflare R2...`);

    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: selectedFiles.map((f) => ({
            fileName: f.name,
            fileType: f.type,
            fileSize: f.size,
          })),
        }),
      });

      const presignData = await presignRes.json();

      if (presignRes.ok && presignData.success && presignData.items) {
        const uploadPromises = selectedFiles.map(async (file, i) => {
          const item = presignData.items[i];
          const uploadRes = await fetch(item.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) {
            throw new Error(`Gagal mengunggah foto "${file.name}" ke Cloudflare R2.`);
          }
          return item.publicUrl as string;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        setPhotoUrls((prev) => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} foto berhasil diunggah ke R2 storage!`, { id: toastId });
      } else {
        toast.info("Mengunggah foto mode lokal...", { id: toastId });
        const fallbackUrls: string[] = [];
        for (const file of selectedFiles) {
          const body = new FormData();
          body.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body });
          const data = await res.json();
          if (data.success && data.url) {
            fallbackUrls.push(data.url);
          }
        }
        setPhotoUrls((prev) => [...prev, ...fallbackUrls]);
        toast.success(`${fallbackUrls.length} foto berhasil dilampirkan.`, { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gagal mengunggah foto.", { id: toastId });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.info("Foto dihapus dari daftar lampiran.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photoUrls,
          photoUrl: photoUrls[0] || null,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Gagal mengirimkan pengaduan.");
        setLoading(false);
        return;
      }

      setSuccessData(data.data);
      toast.success("Pengaduan berhasil diajukan!");
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setPhotoUrls([]);
    setFormData({
      division: "TEKNISI",
      regionId: regions[0]?.id || "",
      institutionName: "",
      reporterName: "",
      reporterPhone: "",
      reporterAddress: "",
      deviceBrand: "",
      serialNumber: "",
      title: "",
      description: "",
      priority: "MEDIUM",
    });
  };

  return {
    regions,
    loading,
    uploading,
    photoUrls,
    successData,
    formData,
    setFormData,
    handleFileUpload,
    handleRemovePhoto,
    handleSubmit,
    handleReset,
  };
}

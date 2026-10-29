"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LayoutDashboard } from "lucide-react";

export function AuthNavButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let ignore = false;

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore) {
          setIsLoggedIn(Boolean(data?.success && data?.data));
        }
      })
      .catch(() => {
        if (!ignore) setIsLoggedIn(false);
      });

    const handleAuthChange = () => {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!ignore) {
            setIsLoggedIn(Boolean(data?.success && data?.data));
          }
        })
        .catch(() => {});
    };

    window.addEventListener("auth-changed", handleAuthChange);
    return () => {
      ignore = true;
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, [pathname]);

  if (isLoggedIn) {
    return (
      <Link
        href="/dashboard"
        className="ml-2 px-3.5 py-2 rounded-lg bg-ssm-blue hover:bg-ssm-blue-hover text-white flex items-center gap-1.5 shadow-xs transition"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Dashboard</span>
      </Link>
    );
  }

  return (
    <Link
      href="/masuk"
      className="ml-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs transition"
    >
      <LogIn className="w-4 h-4" />
      <span>Portal Staf</span>
    </Link>
  );
}

export function AuthNavFallback() {
  return (
    <Link
      href="/masuk"
      className="ml-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-sm transition"
    >
      <LogIn className="w-4 h-4" />
      <span>Portal Staf</span>
    </Link>
  );
}

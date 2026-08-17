"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ThemeToggleButton } from "@/src/components/common/ThemeToggleButton";
import { Icon } from "@/src/components/ui/Icon";
import { useSidebar } from "./SidebarContext";
import UserMenu from "./UserMenu";

interface HeaderProps {
  nombre: string;
  email: string;
  organizacionNombre?: string;
}

export default function Header({ nombre, email, organizacionNombre }: HeaderProps) {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-99999 flex w-full bg-white border-gray-200 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            type="button"
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 dark:border-gray-800 dark:text-gray-400 lg:flex lg:h-11 lg:w-11 lg:border lg:border-gray-200"
            onClick={handleToggle}
            aria-label="Alternar menú"
          >
            <Icon name={isMobileOpen ? "mdi:close" : "mdi:menu"} size={isMobileOpen ? 24 : 20} />
          </button>

          <Link href="/dashboard" className="lg:hidden">
            <Image
              width={154}
              height={32}
              className="dark:hidden"
              src="/images/logo/logo.svg"
              alt="GVR CRM"
            />
            <Image
              width={154}
              height={32}
              className="hidden dark:block"
              src="/images/logo/logo-dark.svg"
              alt="GVR CRM"
            />
          </Link>

          <button
            type="button"
            onClick={() => setApplicationMenuOpen((prev) => !prev)}
            className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Abrir menú"
          >
            <Icon name="mdi:dots-horizontal" size={24} />
          </button>

          <div className="hidden lg:block">
            <form>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:magnify" size={20} />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar o escribir comando..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                >
                  <span>⌘</span>
                  <span>K</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md lg:flex lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            {organizacionNombre && (
              <span className="hidden text-theme-sm font-medium text-gray-500 dark:text-gray-400 sm:block">
                {organizacionNombre}
              </span>
            )}
            <ThemeToggleButton />
          </div>
          <UserMenu nombre={nombre} email={email} />
        </div>
      </div>
    </header>
  );
}

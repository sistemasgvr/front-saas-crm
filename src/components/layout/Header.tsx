"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggleButton } from "@/src/components/common/ThemeToggleButton";
import { Icon } from "@/src/components/ui/Icon";
import NotificationBell from "@/src/modules/notifications/NotificationBell";
import { useSidebar } from "./SidebarContext";
import UserMenu from "./UserMenu";

interface HeaderProps {
  nombre: string;
  email: string;
  organizacionId?: string;
  organizacionNombre?: string;
  profileHref: string;
  settingsHref?: string;
  homeHref?: string;
}

export default function Header({
  nombre,
  email,
  organizacionId,
  organizacionNombre,
  profileHref,
  settingsHref,
  homeHref = "/dashboard",
}: HeaderProps) {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

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

          <Link href={homeHref} className="lg:hidden">
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
            {organizacionId && <NotificationBell organizacionId={organizacionId} />}
          </div>
          <UserMenu nombre={nombre} email={email} profileHref={profileHref} settingsHref={settingsHref} />
        </div>
      </div>
    </header>
  );
}

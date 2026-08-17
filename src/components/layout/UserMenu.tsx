"use client";

import { Icon } from "@/src/components/ui/Icon";
import { Dropdown } from "@/src/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/src/components/ui/dropdown/DropdownItem";
import { logoutAction } from "@/src/modules/auth/actions";
import { useState } from "react";

interface UserMenuProps {
  nombre: string;
  email: string;
  profileHref: string;
  settingsHref?: string;
}

export default function UserMenu({ nombre, email, profileHref, settingsHref }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initials = nombre.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-medium text-brand-500 dark:bg-brand-500/[0.12]">
          {initials}
        </span>
        <span className="mr-1 hidden font-medium text-theme-sm sm:block">{nombre}</span>
        <Icon
          name="mdi:chevron-down"
          size={18}
          className={`text-gray-500 transition-transform duration-200 dark:text-gray-400 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">{nombre}</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{email}</span>
        </div>

        <ul className="flex flex-col gap-1 border-b border-gray-200 pt-4 pb-3 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={() => setIsOpen(false)}
              tag="a"
              href={profileHref}
              className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <Icon name="mdi:account-outline" size={22} className="text-gray-500 dark:text-gray-400" />
              Perfil
            </DropdownItem>
          </li>
          {settingsHref && (
            <li>
              <DropdownItem
                onItemClick={() => setIsOpen(false)}
                tag="a"
                href={settingsHref}
                className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                <Icon name="mdi:cog-outline" size={22} className="text-gray-500 dark:text-gray-400" />
                Configuración
              </DropdownItem>
            </li>
          )}
        </ul>

        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 group text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <Icon name="mdi:logout" size={22} className="text-gray-500 dark:text-gray-400" />
            Cerrar sesión
          </button>
        </form>
      </Dropdown>
    </div>
  );
}

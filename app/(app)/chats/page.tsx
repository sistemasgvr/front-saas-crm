import { Icon } from "@/src/components/ui/Icon";

export default function ChatsPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-3 text-center md:flex">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
        <Icon name="mdi:whatsapp" size={32} className="text-gray-400" />
      </div>
      <div>
        <p className="text-theme-sm font-medium text-gray-700 dark:text-gray-200">Elige una conversación</p>
        <p className="text-theme-xs text-gray-400">Selecciona un chat de la lista para ver los mensajes.</p>
      </div>
    </div>
  );
}

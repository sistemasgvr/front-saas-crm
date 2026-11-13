"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import Pagination from "@/src/components/ui/Pagination";
import Label from "@/src/components/form/Label";
import Select from "@/src/components/form/Select";
import Input from "@/src/components/form/input/InputField";
import PasswordInput from "@/src/components/form/input/PasswordInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/src/components/tables";
import { Icon } from "@/src/components/ui/Icon";
import EmptyState from "@/src/components/ui/EmptyState";
import PageHeader from "@/src/components/ui/PageHeader";
import { PageLoader, QueryError } from "@/src/components/ui/PageLoader";
import TableAction from "@/src/components/ui/TableAction";
import MobileCard from "@/src/components/ui/MobileCard";
import TableCard, {
  tdClass,
  tdPrimaryClass,
  thClass,
  thClassEnd,
} from "@/src/components/ui/TableCard";
import EntityCell from "@/src/components/ui/avatar/EntityCell";
import Badge, { StatusBadge } from "@/src/components/ui/badge/Badge";
import Button from "@/src/components/ui/button/Button";
import DynamicFilters from "@/src/components/ui/filters/DynamicFilters";
import SelectSearch from "@/src/components/ui/filters/SelectSearch";
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from "@/src/components/ui/filters/types";
import ConfirmModal from "@/src/components/ui/modal/ConfirmModal";
import Modal from "@/src/components/ui/modal/Modal";
import ModalFooter from "@/src/components/ui/modal/ModalFooter";
import ModalHeading from "@/src/components/ui/modal/ModalHeading";
import { queryKeys } from "@/src/lib/query/keys";
import { useAppMutation } from "@/src/lib/query/use-app-mutation";
import {
  getUsuariosEmpresa as getUsuariosEmpresaResult,
  getUsuariosEmpresaDestinos as getUsuariosEmpresaDestinosResult,
  guardarUsuarioEmpresa as guardarUsuarioEmpresaResult,
  estadoUsuarioEmpresa as estadoUsuarioEmpresaResult,
  passwordTemporalEmpresa as passwordTemporalEmpresaResult,
  reasignarLeadsUsuario as reasignarLeadsUsuarioResult,
  liberarLeadsUsuario as liberarLeadsUsuarioResult,
} from "./actions";
import type { UsuarioEmpresa } from "./types";
import { getRolesEmpresa as getRolesEmpresaResult } from "../roles/actions";
import { unwrapServerAction } from "@/src/lib/action-result";
const getUsuariosEmpresa = unwrapServerAction(getUsuariosEmpresaResult);
const getUsuariosEmpresaDestinos = unwrapServerAction(getUsuariosEmpresaDestinosResult);
const guardarUsuarioEmpresa = unwrapServerAction(guardarUsuarioEmpresaResult);
const estadoUsuarioEmpresa = unwrapServerAction(estadoUsuarioEmpresaResult);
const passwordTemporalEmpresa = unwrapServerAction(passwordTemporalEmpresaResult);
const reasignarLeadsUsuario = unwrapServerAction(reasignarLeadsUsuarioResult);
const liberarLeadsUsuario = unwrapServerAction(liberarLeadsUsuarioResult);
const getRolesEmpresa = unwrapServerAction(getRolesEmpresaResult);


const key = ["organization-users"];
const dejarSinAsignar = "sin_asignar";
const campos: DynamicFilterFieldDef[] = [
  {
    key: "q",
    label: "Buscar",
    type: "text",
    placeholder: "Nombre, email o teléfono",
  },
  {
    key: "rol",
    label: "Rol",
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "PROPIETARIO", label: "Propietario" },
      { value: "ADMINISTRADOR", label: "Administrador" },
      { value: "USUARIO", label: "Asesor" },
      { value: "PERSONALIZADO", label: "Roles personalizados" },
    ],
  },
  {
    key: "estado",
    label: "Estado",
    type: "select",
    placeholder: "Todos",
    options: [
      { value: "activo", label: "Activos" },
      { value: "inactivo", label: "Desactivados" },
      { value: "suspendido", label: "Suspendidos por plataforma" },
    ],
  },
];

export default function UsuariosEmpresaView({
  usuarioId,
}: {
  usuarioId: string;
}) {
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<UsuarioEmpresa | "nuevo" | null>(null);
  const [rolEditor, setRolEditor] = useState("");
  const [estado, setEstado] = useState<UsuarioEmpresa | null>(null);
  const [password, setPassword] = useState<UsuarioEmpresa | null>(null);
  const [reasignar, setReasignar] = useState<UsuarioEmpresa | null>(null);
  const [destino, setDestino] = useState(dejarSinAsignar);
  const [filtros, setFiltros] = useState<DynamicFilterValues>({});
  const busqueda = useDeferredValue(filtros.q ?? "")
    .trim()
    .toLowerCase();
  const params = { page, q: busqueda, rol: filtros.rol, estado: filtros.estado };
  const query = useQuery({ queryKey: [...key, params], queryFn: () => getUsuariosEmpresa(params) });
  const destinos = useQuery({
    queryKey: [...key, "destinos"],
    queryFn: getUsuariosEmpresaDestinos,
    enabled: !!reasignar || estado?.estado === 1,
  });
  const rolesQuery = useQuery({
    queryKey: queryKeys.organizationRoles,
    queryFn: () => getRolesEmpresa(),
  });
  // El propietario lo asigna solo la plataforma.
  const opcionesRol = (rolesQuery.data ?? [])
    .filter((r) => r.codigo !== "PROPIETARIO")
    .map((r) => ({ value: r.id, label: r.nombre }));
  const rolAsesorId =
    rolesQuery.data?.find((r) => r.codigo === "USUARIO")?.id ?? "";
  const invalidar = [key, queryKeys.me, queryKeys.organizationRoles];
  const invalidarLeads = [queryKeys.leadsAll, queryKeys.whatsappChats];
  const guardar = useAppMutation({
    mutationFn: async ({
      id,
      datos,
    }: {
      id: string | null;
      datos: Parameters<typeof guardarUsuarioEmpresa>[1];
    }) => {
      await guardarUsuarioEmpresa(id, datos);
      setEditor(null);
    },
    successMessage: "Usuario guardado",
    invalidateKeys: invalidar,
  });
  const cambiar = useAppMutation({
    mutationFn: async (u: UsuarioEmpresa) => {
      await estadoUsuarioEmpresa(
        u.id,
        u.estado === 1 ? 0 : 1,
        u.estado === 1 && destino !== dejarSinAsignar ? destino : undefined,
      );
      setEstado(null);
    },
    successMessage: "Estado actualizado",
    invalidateKeys: [...invalidar, ...invalidarLeads],
  });
  const reset = useAppMutation({
    mutationFn: async (value: string) => {
      if (!password) return;
      await passwordTemporalEmpresa(password.id, value);
      setPassword(null);
    },
    successMessage:
      "Contraseña temporal guardada. El usuario deberá cambiarla al ingresar.",
    invalidateKeys: invalidar,
  });
  const mover = useAppMutation({
    mutationFn: async () => {
      if (!reasignar) return;
      if (destino === dejarSinAsignar) await liberarLeadsUsuario(reasignar.id);
      else await reasignarLeadsUsuario(reasignar.id, destino);
      setReasignar(null);
    },
    successMessage: "Asignación de leads actualizada",
    invalidateKeys: [key, ...invalidarLeads],
  });

  function selectorDestino(id: string, origenId: string, disabled: boolean) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Destino de los leads</Label>
        <SelectSearch
          id={id}
          value={destino}
          disabled={disabled}
          onChange={(value) => setDestino(value || dejarSinAsignar)}
          placeholder="Selecciona un destino"
          searchPlaceholder="Buscar usuario por nombre o email"
          options={[
            { value: dejarSinAsignar, label: "Dejar sin asignar" },
            ...(destinos.data ?? [])
              .filter((u) => u.id !== origenId)
              .map((u) => ({
                value: u.id,
                label: `${u.nombre} ${u.apellido ?? ""} · ${u.email}`,
              })),
          ]}
        />
        {destinos.isError && (
          <p role="alert" className="text-sm text-error-600">
            No se pudo cargar la lista de asesores activos.
          </p>
        )}
      </div>
    );
  }

  if (query.isLoading) return <PageLoader label="Cargando usuarios…" />;
  if (query.isError) return <QueryError error={query.error} />;
  if (!query.data) return null;
  const { data: usuarios, activos, limite } = query.data;
  const lleno = limite !== null && activos >= limite;
  const superado = limite !== null && activos > limite;
  const actual = editor && editor !== "nuevo" ? editor : null;
  const filtrados = usuarios;
  const abrirEditor = (u: UsuarioEmpresa | "nuevo") => {
    guardar.reset();
    setRolEditor(u === "nuevo" ? rolAsesorId : (u.rolId ?? ""));
    setEditor(u);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    guardar.mutate({
      id: actual?.id ?? null,
      datos: {
        nombre: String(f.get("nombre")).trim(),
        apellido: String(f.get("apellido") ?? "").trim(),
        telefono: String(f.get("telefono") ?? "").trim(),
        rolId: rolEditor,
        ...(!actual
          ? {
              email: String(f.get("email")).trim(),
              password: String(f.get("password")),
            }
          : {}),
      },
    });
  };
  const nombre = (u: UsuarioEmpresa) =>
    `${u.nombre} ${u.apellido ?? ""}${u.id === usuarioId ? " (tú)" : ""}`.trim();
  const estadoUsuario = (u: UsuarioEmpresa) =>
    !u.cuentaActiva ? (
      <Badge color="error">Suspendida por plataforma</Badge>
    ) : (
      <StatusBadge active={u.estado === 1} inactiveLabel="Desactivado" />
    );
  const rolUsuario = (u: UsuarioEmpresa) => (
    <Badge
      color={
        u.rol === "PROPIETARIO"
          ? "primary"
          : u.rol === "ADMINISTRADOR"
            ? "info"
            : u.rol === "PERSONALIZADO"
              ? "warning"
              : "light"
      }
    >
      {u.rolNombre}
    </Badge>
  );
  const detalle = (u: UsuarioEmpresa) => (
    <p className="mt-2 text-theme-xs text-gray-500">
      {u.leadsAsignados} leads asignados
      {u.debeCambiarPassword === 1 ? " · Cambio de contraseña pendiente" : ""}
    </p>
  );
  const acciones = (u: UsuarioEmpresa) =>
    u.rol === "PROPIETARIO" ? (
      <p className="text-theme-xs text-gray-500">Gestionado por plataforma</p>
    ) : (
      <div className="flex shrink-0 items-center justify-end gap-1">
        <TableAction
          icon="mdi:pencil-outline"
          label={`Editar ${u.nombre}`}
          onClick={() => abrirEditor(u)}
        />
        {u.id !== usuarioId && (
          <>
            <TableAction
              icon={
                u.estado === 1
                  ? "mdi:account-off-outline"
                  : "mdi:account-check-outline"
              }
              variant={u.estado === 1 ? "danger" : "default"}
              disabled={u.estado !== 1 && (lleno || !u.cuentaActiva)}
              label={
                u.estado === 1
                  ? `Desactivar ${u.nombre}`
                  : !u.cuentaActiva
                    ? "La plataforma debe activar esta cuenta"
                    : lleno
                      ? "Sin cupo para reactivar"
                      : `Reactivar ${u.nombre}`
              }
              onClick={() => {
                cambiar.reset();
                setDestino(dejarSinAsignar);
                setEstado(u);
              }}
            />
            <TableAction
              icon="mdi:lock-reset"
              label={`Contraseña temporal de ${u.nombre}`}
              onClick={() => {
                reset.reset();
                setPassword(u);
              }}
            />
          </>
        )}
        {(u.estado === 0 || !u.cuentaActiva) && u.leadsAsignados > 0 && (
          <TableAction
            icon="mdi:account-switch-outline"
            label={`Gestionar ${u.leadsAsignados} leads de ${u.nombre}`}
            onClick={() => {
              mover.reset();
              setDestino(dejarSinAsignar);
              setReasignar(u);
            }}
          />
        )}
      </div>
    );

  return (
    <div data-tour="users-page" className="space-y-5">
      <PageHeader
        title="Usuarios"
        description="Gestiona el acceso de tu equipo a esta empresa."
        backHref="/settings"
        backLabel="Configuración"
      >
        <DynamicFilters
          fields={campos}
          values={filtros}
          onChange={(value) => { setPage(1); setFiltros(value); }}
        />
        <Button
          size="sm"
          disabled={lleno}
          startIcon={<Icon name="mdi:account-plus" size={18} />}
          onClick={() => abrirEditor("nuevo")}
        >
          Nuevo usuario
        </Button>
      </PageHeader>
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <Badge
          size="md"
          color={superado ? "error" : lleno ? "warning" : "primary"}
        >
          {activos}{" "}
          {limite === null
            ? "usuarios activos · Sin límite"
            : `de ${limite} usuarios`}
          {superado ? " · Límite superado" : ""}
        </Badge>
        <p className="text-theme-sm text-gray-500">
          {lleno
            ? "Contacta a soporte para ampliar el plan. Puedes editar o desactivar usuarios."
            : "El propietario también cuenta. Las cuentas suspendidas y de plataforma no consumen cupo."}
        </p>
      </div>
      <div className="space-y-3 md:hidden">
        {filtrados.length === 0 ? (
          <TableCard>
            <EmptyState
              icon="mdi:account-group-outline"
              title="No hay usuarios con estos filtros."
              description="Prueba otra búsqueda o cambia rol y estado."
            />
          </TableCard>
        ) : (
          filtrados.map((u) => (
            <MobileCard
              key={u.id}
              header={<EntityCell name={nombre(u)} subtitle={u.email} size="md" />}
              aside={rolUsuario(u)}
              fields={[
                { label: "Estado", value: estadoUsuario(u) },
                { label: "Leads asignados", value: u.leadsAsignados },
                ...(u.debeCambiarPassword === 1
                  ? [{ label: "Contraseña", value: <span className="text-warning-500">Cambio pendiente</span> }]
                  : []),
              ]}
              actions={acciones(u)}
            />
          ))
        )}
      </div>
      <div className="hidden md:block">
        <TableCard>
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Usuario
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Rol
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Estado
                </TableCell>
                <TableCell isHeader className={thClassEnd}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtrados.length === 0 && (
                <EmptyState
                  colSpan={4}
                  icon="mdi:account-group-outline"
                  title="No hay usuarios con estos filtros."
                  description="Prueba otra búsqueda o cambia rol y estado."
                />
              )}
              {filtrados.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className={tdPrimaryClass}>
                    <div className="max-w-xs">
                      <EntityCell name={nombre(u)} subtitle={u.email} />
                      {detalle(u)}
                    </div>
                  </TableCell>
                  <TableCell className={tdClass}>{rolUsuario(u)}</TableCell>
                  <TableCell className={tdClass}>{estadoUsuario(u)}</TableCell>
                  <TableCell className="px-5 py-4">{acciones(u)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </div>
      <Pagination {...query.data} onPageChange={setPage} itemLabel="usuarios" />
      <Modal
        open={!!editor}
        onClose={() => {
          if (!guardar.isPending) setEditor(null);
        }}
        header={
          <ModalHeading
            title={actual ? "Editar usuario" : "Nuevo usuario"}
            icon={
              actual ? "mdi:account-edit-outline" : "mdi:account-plus-outline"
            }
          />
        }
        footer={
          <ModalFooter
            error={guardar.isError ? guardar.error.message : undefined}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={guardar.isPending}
              onClick={() => setEditor(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="usuario-form"
              size="sm"
              loading={guardar.isPending}
              startIcon={<Icon name="mdi:content-save-outline" size={18} />}
            >
              Guardar usuario
            </Button>
          </ModalFooter>
        }
      >
        <form
          id="usuario-form"
          key={actual?.id ?? "nuevo"}
          onSubmit={submit}
          className="space-y-4 p-5"
        >
          <fieldset disabled={guardar.isPending} className="space-y-4">
            <div>
              <Label htmlFor="usuario-nombre">Nombre</Label>
              <Input
                id="usuario-nombre"
                name="nombre"
                required
                maxLength={120}
                defaultValue={actual?.nombre ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="usuario-apellido">Apellido</Label>
              <Input
                id="usuario-apellido"
                name="apellido"
                maxLength={120}
                defaultValue={actual?.apellido ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="usuario-telefono">Teléfono</Label>
              <Input
                id="usuario-telefono"
                name="telefono"
                maxLength={40}
                defaultValue={actual?.telefono ?? ""}
              />
            </div>
            {!actual && (
              <>
                <div>
                  <Label htmlFor="usuario-email">Email</Label>
                  <Input
                    id="usuario-email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="usuario-password">Contraseña temporal</Label>
                  <PasswordInput
                    id="usuario-password"
                    name="password"
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Debe cambiarla en su primer ingreso. Cada cuenta pertenece a
                    una sola empresa.
                  </p>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="usuario-rol">Rol</Label>
              <Select
                id="usuario-rol"
                name="rol"
                options={opcionesRol}
                placeholder="Selecciona un rol"
                disabled={actual?.id === usuarioId || rolesQuery.isLoading}
                value={rolEditor}
                onChange={setRolEditor}
              />
            </div>
          </fieldset>
        </form>
      </Modal>
      <ConfirmModal
        open={estado?.estado === 0}
        title="Reactivar usuario"
        icon="mdi:account-check-outline"
        description={`Se reactivará el acceso de ${estado?.nombre ?? ""}. Esta acción consume una plaza del plan.`}
        error={cambiar.isError ? cambiar.error.message : undefined}
        confirmLabel="Reactivar"
        loading={cambiar.isPending}
        onClose={() => {
          if (!cambiar.isPending) setEstado(null);
        }}
        onConfirm={() => {
          if (estado) cambiar.mutate(estado);
        }}
      />
      <Modal
        open={estado?.estado === 1}
        onClose={() => {
          if (!cambiar.isPending) setEstado(null);
        }}
        header={
          <ModalHeading
            title="Desactivar usuario"
            icon="mdi:account-off-outline"
            danger
          />
        }
        footer={
          <ModalFooter error={cambiar.isError ? cambiar.error.message : undefined}>
            <Button
              size="sm"
              variant="outline"
              disabled={cambiar.isPending}
              onClick={() => setEstado(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={cambiar.isPending}
              onClick={() => {
                if (estado) cambiar.mutate(estado);
              }}
            >
              Desactivar
            </Button>
          </ModalFooter>
        }
      >
        {estado && (
          <div className="space-y-4 p-5">
            <p className="text-sm text-gray-500">
              {estado.nombre} perderá el acceso a la empresa y se liberará el
              control de sus chats. Actualmente tiene {estado.leadsAsignados}{" "}
              leads activos asignados.
            </p>
            {selectorDestino("desactivar-destino", estado.id, cambiar.isPending)}
          </div>
        )}
      </Modal>
      <Modal
        open={!!password}
        onClose={() => {
          if (!reset.isPending) setPassword(null);
        }}
        header={
          <ModalHeading
            title="Restablecer contraseña temporal"
            icon="mdi:lock-reset"
          />
        }
        footer={
          <ModalFooter error={reset.isError ? reset.error.message : undefined}>
            <Button
              size="sm"
              variant="outline"
              disabled={reset.isPending}
              onClick={() => setPassword(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="reset-password-form"
              size="sm"
              loading={reset.isPending}
              startIcon={<Icon name="mdi:lock-reset" size={18} />}
            >
              Guardar contraseña temporal
            </Button>
          </ModalFooter>
        }
      >
        <form
          id="reset-password-form"
          key={password?.id ?? "password"}
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            reset.mutate(String(new FormData(e.currentTarget).get("password")));
          }}
        >
          <p className="text-sm text-gray-500">
            {password?.nombre} deberá cambiar esta contraseña al ingresar. Se
            cerrarán sus sesiones de refresco.
          </p>
          <Label htmlFor="reset-password">Contraseña temporal</Label>
          <PasswordInput
            id="reset-password"
            name="password"
            required
            minLength={8}
            maxLength={72}
            disabled={reset.isPending}
            autoComplete="new-password"
          />
        </form>
      </Modal>
      <Modal
        open={!!reasignar}
        onClose={() => {
          if (!mover.isPending) setReasignar(null);
        }}
        header={
          <ModalHeading
            title="Gestionar leads asignados"
            icon="mdi:account-switch-outline"
          />
        }
        footer={
          <ModalFooter error={mover.isError ? mover.error.message : undefined}>
            <Button
              size="sm"
              variant="outline"
              disabled={mover.isPending}
              onClick={() => setReasignar(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="reasignar-form"
              size="sm"
              loading={mover.isPending}
              startIcon={<Icon name="mdi:account-switch-outline" size={18} />}
            >
              {destino === dejarSinAsignar ? "Liberar leads" : "Reasignar leads"}
            </Button>
          </ModalFooter>
        }
      >
        <form
          id="reasignar-form"
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mover.isPending) mover.mutate();
          }}
        >
          <p className="text-sm text-gray-500">
            {reasignar?.nombre} tiene {reasignar?.leadsAsignados ?? 0} leads
            activos asignados. Puedes liberarlos para que el equipo los tome
            o reasignarlos a un asesor activo.
          </p>
          {reasignar && selectorDestino("reasignar-destino", reasignar.id, mover.isPending)}
        </form>
      </Modal>
    </div>
  );
}

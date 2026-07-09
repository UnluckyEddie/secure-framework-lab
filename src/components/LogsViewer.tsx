"use client";

// CLASE: visor interactivo de logs. Es un componente CLIENTE porque necesita
// estado (filtros, búsqueda) y efectos (auto-refresh). Recibe los logs iniciales
// desde el servidor y luego puede refrescarlos llamando a /api/admin/logs.
import { useCallback, useEffect, useState } from "react";
import type { SecurityLog, LogCategory, LogSeverity } from "@/lib/securityLogger";

// Colores por categoría (mismo criterio que antes, para reconocerlas de un vistazo).
const categoryStyles: Record<LogCategory, string> = {
  AUTH: "bg-slate-100 text-slate-700",
  AUTHZ: "bg-purple-100 text-purple-700",
  ADMIN: "bg-indigo-100 text-indigo-700",
  ERROR: "bg-red-100 text-red-700",
  VISIT: "bg-green-100 text-green-700",
  ATTACK: "bg-red-200 text-red-800",
};

const severityStyles: Record<LogSeverity, string> = {
  INFO: "bg-blue-100 text-blue-700",
  WARNING: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

const CATEGORIES: LogCategory[] = [
  "AUTH",
  "AUTHZ",
  "ADMIN",
  "ERROR",
  "VISIT",
  "ATTACK",
];
const SEVERITIES: LogSeverity[] = ["INFO", "WARNING", "ERROR"];

interface LogsViewerProps {
  initialLogs: SecurityLog[];
}

export function LogsViewer({ initialLogs }: LogsViewerProps) {
  const [logs, setLogs] = useState<SecurityLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LogCategory | "ALL">("ALL");
  const [severity, setSeverity] = useState<LogSeverity | "ALL">("ALL");
  // Auto-refresh activado por defecto: así se ve el tráfico en vivo (útil para
  // observar en tiempo real las conexiones de otras máquinas).
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);

  // CLASE: pide los logs más recientes al servidor (para refrescar sin recargar).
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/logs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
      }
    } catch {
      // Si falla, dejamos los logs actuales.
    } finally {
      setLoading(false);
    }
  }, []);

  // CLASE: auto-refresh — cada 4 segundos vuelve a pedir los logs si está activo.
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [autoRefresh, refresh]);

  // CLASE: borra todos los logs tras confirmar (acción de administrador).
  async function clearLogs() {
    if (!confirm("¿Borrar TODOS los logs? Esta acción no se puede deshacer."))
      return;
    setLoading(true);
    try {
      await fetch("/api/admin/logs", { method: "DELETE" });
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  // CLASE: exporta los logs filtrados a un archivo (JSON o CSV) descargable.
  function exportLogs(format: "json" | "csv") {
    let content = "";
    let type = "application/json";
    let ext = "json";

    if (format === "json") {
      content = JSON.stringify(filtered, null, 2);
    } else {
      const headers = [
        "timestamp",
        "category",
        "severity",
        "user",
        "role",
        "ip",
        "client",
        "method",
        "resource",
        "statusCode",
        "message",
      ];
      const rows = filtered.map((l) =>
        headers
          .map((h) => `"${String(l[h as keyof SecurityLog] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
      content = [headers.join(","), ...rows].join("\n");
      type = "text/csv";
      ext = "csv";
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // CLASE: aplica búsqueda + filtros sobre los logs. Con el React Compiler no
  // hace falta useMemo: se memoiza automáticamente.
  const term = search.trim().toLowerCase();
  const filtered = logs.filter((log) => {
    if (category !== "ALL" && log.category !== category) return false;
    if (severity !== "ALL" && log.severity !== severity) return false;
    if (!term) return true;
    // Busca el término en varios campos a la vez.
    const haystack = [
      log.user,
      log.ip,
      log.resource,
      log.message,
      log.client,
      log.role,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  // CLASE: contadores para las tarjetas de resumen.
  const stats = {
    total: logs.length,
    visitas: logs.filter((l) => l.category === "VISIT").length,
    ataques: logs.filter((l) => l.category === "ATTACK").length,
    denegados: logs.filter((l) => l.category === "AUTHZ").length,
    errores: logs.filter((l) => l.severity === "ERROR").length,
  };

  // CLASE: ACTIVIDAD POR IP — agrupamos los eventos por IP de origen para ver
  // el comportamiento de cada una (cuántas peticiones, ataques, rutas, etc.).
  const ipMap = new Map<
    string,
    {
      ip: string;
      total: number;
      ataques: number;
      denegados: number;
      recursos: Set<string>;
      ultima: string;
    }
  >();
  for (const log of logs) {
    const key = log.ip || "desconocida";
    const row =
      ipMap.get(key) ??
      {
        ip: key,
        total: 0,
        ataques: 0,
        denegados: 0,
        recursos: new Set<string>(),
        ultima: log.timestamp,
      };
    row.total += 1;
    if (log.category === "ATTACK") row.ataques += 1;
    if (log.category === "AUTHZ") row.denegados += 1;
    row.recursos.add(log.resource.split("?")[0]);
    if (log.timestamp > row.ultima) row.ultima = log.timestamp;
    ipMap.set(key, row);
  }
  // Ordenamos: primero las IP con más ataques, luego las más activas.
  const ipRows = Array.from(ipMap.values()).sort(
    (a, b) => b.ataques - a.ataques || b.total - a.total
  );

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} tone="slate" />
        <StatCard label="Visitas" value={stats.visitas} tone="green" />
        <StatCard label="Ataques" value={stats.ataques} tone="red" />
        <StatCard label="Denegados" value={stats.denegados} tone="purple" />
        <StatCard label="Errores" value={stats.errores} tone="amber" />
      </div>

      {/* Barra de herramientas */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario, IP, recurso, mensaje..."
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as LogSeverity | "ALL")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Toda severidad</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Auto (4s)
          </label>

          <button
            onClick={() => exportLogs("json")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar JSON
          </button>
          <button
            onClick={() => exportLogs("csv")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar CSV
          </button>
          <button
            onClick={clearLogs}
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Limpiar logs
          </button>
        </div>

        {/* Filtros por categoría (chips) */}
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip
            active={category === "ALL"}
            onClick={() => setCategory("ALL")}
            label="Todas"
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
              label={c}
              className={categoryStyles[c]}
            />
          ))}
        </div>
      </div>

      {/* Actividad por IP */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Actividad por IP
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {ipRows.length} IP distintas
          </span>
        </div>
        {ipRows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Aún no hay actividad. Consejo: prueba visitar{" "}
            <code className="rounded bg-slate-100 px-1">
              /dashboard?simip=8.8.8.8
            </code>{" "}
            para simular otra IP.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr className="text-slate-500">
                  <th className="px-3 py-2 font-medium">IP</th>
                  <th className="px-3 py-2 font-medium">Eventos</th>
                  <th className="px-3 py-2 font-medium">Ataques</th>
                  <th className="px-3 py-2 font-medium">Denegados</th>
                  <th className="px-3 py-2 font-medium">Rutas distintas</th>
                  <th className="px-3 py-2 font-medium">Última actividad</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ipRows.map((row) => {
                  const sospechosa = row.ataques > 0;
                  return (
                    <tr
                      key={row.ip}
                      className={`border-t border-slate-100 ${
                        sospechosa ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-mono font-medium">
                        {row.ip}
                      </td>
                      <td className="px-3 py-2">{row.total}</td>
                      <td className="px-3 py-2 font-semibold text-red-700">
                        {row.ataques || "-"}
                      </td>
                      <td className="px-3 py-2 text-purple-700">
                        {row.denegados || "-"}
                      </td>
                      <td className="px-3 py-2">{row.recursos.size}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                        {new Date(row.ultima).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        {sospechosa ? (
                          <span className="rounded-full bg-red-200 px-2 py-0.5 font-medium text-red-800">
                            Sospechosa
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Eventos registrados
          </h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            {filtered.length} de {logs.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No hay eventos que coincidan con los filtros. Navega por la app,
            inicia sesión o intenta un ataque de prueba para generar logs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50">
                <tr className="text-slate-500">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2 font-medium">Severidad</th>
                  <th className="px-3 py-2 font-medium">Usuario</th>
                  <th className="px-3 py-2 font-medium">Rol</th>
                  <th className="px-3 py-2 font-medium">IP</th>
                  <th className="px-3 py-2 font-medium">Navegador</th>
                  <th className="px-3 py-2 font-medium">Método</th>
                  <th className="px-3 py-2 font-medium">Recurso</th>
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr
                    key={log.eventId}
                    className={`border-t border-slate-100 hover:bg-slate-50 ${
                      log.category === "ATTACK" ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${categoryStyles[log.category]}`}
                      >
                        {log.category}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${severityStyles[log.severity]}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{log.user}</td>
                    <td className="px-3 py-2 text-slate-500">{log.role ?? "-"}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono">
                      {log.ip}
                    </td>
                    <td
                      className="whitespace-nowrap px-3 py-2 text-slate-600"
                      title={log.userAgent ?? ""}
                    >
                      {log.client ?? "-"}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-500">
                      {log.method}
                    </td>
                    <td className="max-w-[16rem] truncate px-3 py-2 font-mono" title={log.resource}>
                      {log.resource}
                    </td>
                    <td className="px-3 py-2">{log.statusCode}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {log.message}
                      {log.attackTypes && log.attackTypes.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {log.attackTypes.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700"
                            >
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Tarjeta de estadística pequeña y coloreada según el tono.
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "green" | "red" | "purple" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-900",
    green: "border-green-200 bg-green-50 text-green-800",
    red: "border-red-200 bg-red-50 text-red-800",
    purple: "border-purple-200 bg-purple-50 text-purple-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Chip de filtro por categoría.
function FilterChip({
  active,
  onClick,
  label,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : `${className || "bg-slate-100 text-slate-600"} hover:opacity-80`
      }`}
    >
      {label}
    </button>
  );
}

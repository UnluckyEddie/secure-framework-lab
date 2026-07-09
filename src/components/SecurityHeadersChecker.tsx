"use client";

import { useEffect, useState } from "react";

export function SecurityHeadersChecker() {
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/")
      .then((res) => {
        const found: Record<string, string> = {};
        const toCheck = [
          "x-frame-options",
          "x-content-type-options",
          "referrer-policy",
          "permissions-policy",
          "content-security-policy",
        ];
        toCheck.forEach((key) => {
          const value = res.headers.get(key);
          if (value) found[key] = value;
        });
        setHeaders(found);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="mt-4 text-xs text-slate-400">Verificando headers...</p>;
  }

  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs font-medium text-slate-600">
        Headers detectados en respuesta:
      </p>
      {Object.keys(headers).length === 0 ? (
        <p className="text-xs text-amber-600">No se detectaron headers de seguridad</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {Object.entries(headers).map(([key, value]) => (
            <li key={key}>
              <span className="font-mono text-green-700">{key}</span>:{" "}
              <span className="text-slate-600">{value.substring(0, 60)}...</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

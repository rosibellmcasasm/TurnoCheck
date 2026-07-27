"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, MapPin, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesForDate,
  crearMarcacionEntrada,
  marcarSalida,
  type Company,
  type Employee,
  type TimeEntry,
} from "@/lib/supabase/queries";
import { hoyISO, horaAhora } from "@/lib/app-storage";

type FaseCamara = "cargando-datos" | "cargando" | "lista" | "error" | "capturada";
type EstadoGeo = "buscando" | "ok" | "error";

function MarcarContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const empleadoId = params.get("empleado") ?? "";

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [fase, setFase] = useState<FaseCamara>("cargando-datos");
  const [foto, setFoto] = useState<Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [geo, setGeo] = useState<EstadoGeo>("buscando");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [esFestivo, setEsFestivo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [empleado, setEmpleado] = useState<Employee | null>(null);
  const [turnoAbierto, setTurnoAbierto] = useState<TimeEntry | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const empresa = await ensureCompany(supabase, user.id);
      const [emps, hoy] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listTimeEntriesForDate(supabase, empresa.id, hoyISO()),
      ]);
      setUserId(user.id);
      setCompany(empresa);
      setEmpleado(emps.find((e) => e.id === empleadoId) ?? null);
      setTurnoAbierto(hoy.find((e) => e.employee_id === empleadoId && !e.hora_salida) ?? null);
      setFase("cargando");
    })();
  }, [empleadoId]);

  const tipo: "entrada" | "salida" = turnoAbierto ? "salida" : "entrada";

  useEffect(() => {
    if (fase !== "cargando") return;
    let activo = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (!activo) return;
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setFase("lista");
      })
      .catch(() => activo && setFase("error"));

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("ok");
      },
      () => setGeo("error"),
      { timeout: 8000 },
    );

    return () => {
      activo = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [fase]);

  function capturar() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 375;
    canvas.height = video.videoHeight || 375;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setFoto(blob);
          setFotoPreview(URL.createObjectURL(blob));
        }
      },
      "image/jpeg",
      0.8,
    );
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setFase("capturada");
  }

  async function confirmar() {
    if (!empleado || !company || !userId) return;
    setGuardando(true);
    const supabase = createClient();

    let fotoUrl: string | undefined;
    if (foto) {
      const path = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("marcaciones").upload(path, foto, {
        contentType: "image/jpeg",
      });
      if (!error) fotoUrl = path;
    }

    if (tipo === "entrada") {
      await crearMarcacionEntrada(supabase, userId, company.id, {
        employee_id: empleado.id,
        fecha: hoyISO(),
        hora_entrada: horaAhora(),
        es_festivo: esFestivo,
        foto_url: fotoUrl,
        lat: coords?.lat,
        lng: coords?.lng,
      });
    } else if (turnoAbierto) {
      await marcarSalida(supabase, turnoAbierto.id, horaAhora());
    }
    router.push("/app");
  }

  if (fase === "cargando-datos") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!empleado) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">No encontramos ese empleado.</p>
        <button onClick={() => router.push("/app")} className="text-sm font-semibold text-primary">
          Volver a Hoy
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pt-6">
        <button onClick={() => router.push("/app")} aria-label="Volver">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs text-muted-foreground">
            Marcando {tipo === "entrada" ? "entrada" : "salida"} de
          </p>
          <h1 className="font-display text-base font-bold text-foreground">{empleado.nombre}</h1>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5">
        {fase !== "capturada" ? (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ display: fase === "lista" ? "block" : "none" }}
            />
            {fase === "cargando" && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Abriendo cámara...
              </div>
            )}
            {fase === "error" && (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
                <p className="text-sm text-muted-foreground">
                  No pudimos abrir tu cámara. Revisa los permisos del navegador.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
            {fotoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoPreview} alt="Foto de la marcación" className="h-full w-full object-cover" />
            )}
            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-success text-white">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-card px-4 py-3 text-sm">
          <MapPin
            className={`h-4 w-4 shrink-0 ${geo === "ok" ? "text-success" : "text-muted-foreground"}`}
          />
          <span className="text-foreground">
            {geo === "buscando" && "Buscando tu ubicación..."}
            {geo === "ok" && "Ubicación verificada"}
            {geo === "error" && "No pudimos confirmar tu ubicación (puedes continuar igual)"}
          </span>
        </div>

        {tipo === "entrada" && (
          <label className="mt-3 flex items-center gap-2 px-1 text-sm text-foreground">
            <input
              type="checkbox"
              checked={esFestivo}
              onChange={(e) => setEsFestivo(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Hoy es festivo en Colombia
          </label>
        )}

        <p className="mt-3 px-1 text-xs leading-snug text-muted-foreground">
          Esta foto y ubicación solo se usan para respaldar a {empleado.nombre.split(" ")[0]} y
          al negocio ante cualquier reclamo — nadie más las ve.
        </p>

        <div className="mt-auto pt-5">
          {fase === "lista" && (
            <button
              onClick={capturar}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground"
              style={{ height: 52 }}
            >
              <Camera className="h-4.5 w-4.5" /> Tomar foto y marcar {tipo}
            </button>
          )}
          {fase === "error" && (
            <button
              onClick={confirmar}
              className="flex h-12 w-full items-center justify-center rounded-lg border border-border bg-card text-[15px] font-semibold text-foreground"
            >
              Continuar sin foto
            </button>
          )}
          {fase === "capturada" && (
            <button
              onClick={confirmar}
              disabled={guardando}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
              style={{ height: 52 }}
            >
              Confirmar {tipo}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarcarPage() {
  return (
    <Suspense fallback={null}>
      <MarcarContenido />
    </Suspense>
  );
}

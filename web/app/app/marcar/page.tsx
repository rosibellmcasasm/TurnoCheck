"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, MapPin, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureCompany,
  listEmployees,
  listTimeEntriesForDate,
  listWorkSites,
  crearMarcacionEntrada,
  marcarSalida,
  type Company,
  type Employee,
  type TimeEntry,
  type WorkSite,
} from "@/lib/supabase/queries";
import { hoyISO, horaAhora } from "@/lib/app-storage";
import { esFestivoColombia } from "@/lib/festivos-colombia";
import { dentroDeAlgunSitio } from "@/lib/geo";

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
  // Se autodetecta con el calendario oficial colombiano al montar — el dueño
  // puede ajustarlo igual (ej. un festivo local que la ley nacional no cubre).
  const [esFestivo, setEsFestivo] = useState(() => esFestivoColombia(new Date()));
  const [guardando, setGuardando] = useState(false);
  const [sitios, setSitios] = useState<WorkSite[]>([]);

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
      const [emps, hoy, sitiosTrabajo] = await Promise.all([
        listEmployees(supabase, empresa.id),
        listTimeEntriesForDate(supabase, empresa.id, hoyISO()),
        listWorkSites(supabase, empresa.id),
      ]);
      setUserId(user.id);
      setCompany(empresa);
      setEmpleado(emps.find((e) => e.id === empleadoId) ?? null);
      setTurnoAbierto(hoy.find((e) => e.employee_id === empleadoId && !e.hora_salida) ?? null);
      setSitios(sitiosTrabajo.filter((s) => s.activo));
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
        const video = videoRef.current;
        if (!video) {
          setFase("lista");
          return;
        }
        video.srcObject = stream;
        // Bug real corregido: antes se pasaba a "lista" apenas resolvía
        // getUserMedia, sin esperar a que el <video> tuviera un frame real
        // pintado — si el usuario tocaba "Tomar foto" rápido, el canvas
        // capturaba el video todavía en negro (0 frames). Se espera a
        // "loadeddata" (o a que ya esté listo) antes de habilitar la captura.
        if (video.readyState >= 2) {
          setFase("lista");
        } else {
          video.onloadeddata = () => activo && setFase("lista");
        }
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

  /** Brillo promedio 0-255 de un canvas, muestreando ~300 píxeles (no los
   *   300k+ del frame completo — de sobra para detectar un frame negro). */
  function brilloPromedio(canvas: HTMLCanvasElement): number {
    const ctx = canvas.getContext("2d");
    if (!ctx) return 255; // sin forma de medir → no bloquear la captura
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const muestras = 300;
    const paso = Math.max(4, Math.floor(data.length / 4 / muestras) * 4);
    let suma = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += paso) {
      suma += (data[i] + data[i + 1] + data[i + 2]) / 3;
      n++;
    }
    return n > 0 ? suma / n : 255;
  }

  function dibujarFrame(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 375;
    canvas.height = video.videoHeight || 375;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function finalizarCaptura(canvas: HTMLCanvasElement) {
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

  /** Bug real corregido: en algunos celulares la cámara sigue ajustando
   *  exposición/balance de blancos justo después de abrirse (aunque el
   *  video YA tenga un frame técnicamente disponible), y ese primer frame
   *  sale casi negro. Si el brillo promedio es sospechosamente bajo, se
   *  reintenta la captura desde el video (que sigue en vivo) unas pocas
   *  veces antes de darla por buena — sin que el usuario note nada. */
  function capturar(intento = 0) {
    const video = videoRef.current;
    if (!video) return;
    const canvas = dibujarFrame(video);
    const UMBRAL_NEGRO = 12;
    const MAX_INTENTOS = 4;
    if (brilloPromedio(canvas) < UMBRAL_NEGRO && intento < MAX_INTENTOS) {
      setTimeout(() => capturar(intento + 1), 250);
      return;
    }
    finalizarCaptura(canvas);
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
        fuera_de_rango: coords ? !dentroDeAlgunSitio(coords, sitios) : false,
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

        {(() => {
          const fueraDeRango = geo === "ok" && coords ? !dentroDeAlgunSitio(coords, sitios) : false;
          return (
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                fueraDeRango ? "bg-warning-soft" : "bg-card"
              }`}
            >
              <MapPin
                className={`h-4 w-4 shrink-0 ${
                  fueraDeRango ? "text-warning" : geo === "ok" ? "text-success" : "text-muted-foreground"
                }`}
              />
              <span className={fueraDeRango ? "text-warning" : "text-foreground"}>
                {geo === "buscando" && "Buscando tu ubicación..."}
                {geo === "ok" && !fueraDeRango && "Ubicación verificada"}
                {geo === "ok" && fueraDeRango && "⚠️ Lejos de toda obra registrada"}
                {geo === "error" && "No pudimos confirmar tu ubicación (puedes continuar igual)"}
              </span>
            </div>
          );
        })()}

        {tipo === "entrada" && (
          <label className="mt-3 flex items-center gap-2 px-1 text-sm text-foreground">
            <input
              type="checkbox"
              checked={esFestivo}
              onChange={(e) => setEsFestivo(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Hoy es festivo en Colombia
            <span className="text-xs text-muted-foreground">(detectado automático, ajústalo si hace falta)</span>
          </label>
        )}

        <p className="mt-3 px-1 text-xs leading-snug text-muted-foreground">
          Esta foto y ubicación solo se usan para respaldar a {empleado.nombre.split(" ")[0]} y
          al negocio ante cualquier reclamo — nadie más las ve.
        </p>

        <div className="mt-auto pt-5">
          {fase === "lista" && (
            <button
              onClick={() => capturar()}
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

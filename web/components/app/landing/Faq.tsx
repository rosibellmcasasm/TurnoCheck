import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";

const PREGUNTAS = [
  {
    q: "Mis empleados son mayores, ¿van a saber usar esto?",
    a: "Marcar es 1 toque con una foto — más simple que firmar un cuaderno. No requiere capacitación.",
  },
  {
    q: "Tengo pocos empleados, ¿vale la pena pagar un software?",
    a: "El Plan Micro cuesta $9.99/mes. Si hoy pierdes $200.000-$300.000 pesos al mes en horas mal contadas, TurnoCheck se paga solo en la primera semana.",
  },
  {
    q: "¿Qué pasa si un empleado se queda sin internet al marcar?",
    a: "La marcación se guarda en el celular y se envía automáticamente apenas vuelve la señal — nadie pierde su registro.",
  },
  {
    q: "¿Eso sí me sirve legalmente si un empleado me demanda?",
    a: "Cada marcación queda con foto, GPS y hora exacta como respaldo verificable, conforme a la Ley 1581 de Habeas Data.",
  },
  {
    q: "No quiero meter los datos de mi negocio en una app que mañana desaparezca o suba el precio.",
    a: "Tu precio queda fijo mientras mantengas tu plan activo, y tienes la Garantía del Primer Cierre para probar sin riesgo.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Preguntas frecuentes
        </h2>
      </Reveal>
      <Reveal delay={0.05}>
        <Accordion className="mt-8">
          {PREGUNTAS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-display text-[15px] font-semibold text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}

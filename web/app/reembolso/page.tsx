import { LegalPage } from "@/components/app/legal/LegalPage";

export default function ReembolsoPage() {
  return (
    <LegalPage title="Política de Reembolso" updated="26 de julio de 2026">
      <p>
        Queremos que pruebes TurnoCheck sin riesgo. Por eso ofrecemos la{" "}
        <strong>Garantía del Primer Cierre</strong>, además de la garantía
        legal de Hotmart.
      </p>

      <h2>La Garantía del Primer Cierre</h2>
      <p>
        Si dentro de tus primeros 7 días de suscripción no logras completar
        el cierre de nómina de tu primera quincena con TurnoCheck, te
        devolvemos el 100% de lo pagado. Solo escríbenos a{" "}
        <a href="mailto:soporte@turnocheck.co" className="text-primary underline">
          soporte@turnocheck.co
        </a>{" "}
        — sin preguntas, sin formularios.
      </p>

      <h2>Garantía de Hotmart</h2>
      <p>
        Como el pago se procesa a través de Hotmart, también aplica la
        garantía de reembolso vigente de Hotmart (7 días desde la compra),
        que puedes solicitar directamente desde tu panel de comprador de
        Hotmart.
      </p>

      <h2>Cancelaciones</h2>
      <p>
        Puedes cancelar tu suscripción cuando quieras desde tu cuenta. Al
        cancelar, mantienes acceso hasta el final del período que ya
        pagaste; no se realizan reembolsos parciales por el tiempo no usado
        fuera de la ventana de garantía descrita arriba.
      </p>

      <h2>Contacto</h2>
      <p>
        <a href="mailto:soporte@turnocheck.co" className="text-primary underline">
          soporte@turnocheck.co
        </a>
      </p>
    </LegalPage>
  );
}

import { LegalPage } from "@/components/app/legal/LegalPage";

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y Condiciones" updated="26 de julio de 2026">
      <p>
        Al crear una cuenta en TurnoCheck aceptas estos términos. Léelos con
        calma; están escritos en lenguaje simple a propósito.
      </p>

      <h2>Qué es TurnoCheck</h2>
      <p>
        TurnoCheck es una herramienta de marcación de asistencia (con foto y
        GPS) y cálculo de nómina para micro y pequeñas empresas en Colombia.
        No es un software de nómina completo ni reemplaza asesoría contable
        o legal.
      </p>

      <h2>Qué NO promete TurnoCheck</h2>
      <ul>
        <li>No garantizamos que el cálculo automático sea válido ante toda controversia laboral específica — es una herramienta de apoyo, no un concepto jurídico.</li>
        <li>No somos responsables por decisiones tomadas únicamente con base en los reportes de la app sin verificación del dueño del negocio.</li>
        <li>No prestamos servicios de representación legal ni de nómina certificada ante la DIAN o el Ministerio de Trabajo.</li>
      </ul>

      <h2>Uso aceptable</h2>
      <ul>
        <li>El dueño de la cuenta es responsable de contar con el consentimiento de sus empleados para registrar foto y ubicación.</li>
        <li>No está permitido usar TurnoCheck para vigilancia fuera del propósito de control de asistencia laboral.</li>
        <li>Nos reservamos el derecho de suspender cuentas que usen la plataforma de forma fraudulenta o abusiva.</li>
      </ul>

      <h2>Suscripción y pago</h2>
      <p>
        El acceso se vende como suscripción mensual o anual procesada por
        Hotmart. Los precios vigentes se muestran en la página de planes.
        Puedes cancelar cuando quieras desde tu cuenta; el acceso se
        mantiene hasta el final del período ya pagado.
      </p>

      <h2>Limitación de responsabilidad</h2>
      <p>
        TurnoCheck se entrega &quot;tal cual&quot;. En la medida permitida por la ley
        colombiana, no somos responsables por perjuicios indirectos
        derivados del uso de la app. Recomendamos verificar los cálculos
        críticos con tu contador antes de tomar decisiones de pago
        definitivas.
      </p>

      <h2>Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Colombia.</p>

      <h2>Contacto</h2>
      <p>
        <a href="mailto:soporte@turnocheck.co" className="text-primary underline">
          soporte@turnocheck.co
        </a>
      </p>
    </LegalPage>
  );
}

import { LegalPage } from "@/components/app/legal/LegalPage";

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" updated="26 de julio de 2026">
      <p>
        Esta política explica qué datos recopila TurnoCheck, para qué los usa
        y cómo puedes solicitar su eliminación. Aplica a los dueños de
        negocio que crean una cuenta y a los empleados cuyos datos de
        asistencia registran.
      </p>

      <h2>Qué datos recopilamos</h2>
      <ul>
        <li>Datos del dueño/administrador: nombre, correo, teléfono y nombre del negocio.</li>
        <li>Datos de cada empleado: nombre, cargo y horario asignado.</li>
        <li>Datos de cada marcación: foto tomada al marcar, ubicación GPS y hora exacta.</li>
        <li>Datos de uso de la app y de pago (procesados por Hotmart, nunca almacenamos tarjetas).</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Calcular horas trabajadas, recargos y dominicales según la ley colombiana.</li>
        <li>Generar el respaldo de cada marcación (foto + GPS + hora) que sirve como prueba ante reclamos laborales.</li>
        <li>Enviar el reporte de nómina al dueño del negocio o a quien él autorice.</li>
      </ul>

      <h2>Con quién se comparten</h2>
      <p>
        Usamos proveedores de infraestructura (base de datos y almacenamiento
        de fotos) y Hotmart para procesar el pago de la suscripción. Ninguno
        de ellos usa tus datos con fines distintos a operar TurnoCheck.
        Nunca vendemos datos de empleados ni de negocios a terceros.
      </p>

      <h2>Tus derechos (Ley 1581 de 2012 — Habeas Data, Colombia)</h2>
      <p>
        Puedes solicitar en cualquier momento conocer, actualizar, corregir o
        eliminar los datos de tu negocio o de tus empleados escribiendo a{" "}
        <a href="mailto:soporte@turnocheck.co" className="text-primary underline">
          soporte@turnocheck.co
        </a>
        . Al registrarse, el dueño del negocio declara contar con el
        consentimiento de sus empleados para registrar su foto y ubicación
        con fines de control de asistencia y nómina.
      </p>

      <h2>Cuánto tiempo guardamos los datos</h2>
      <p>
        Mientras la cuenta esté activa. Si cancelas tu suscripción, tus datos
        se conservan por el tiempo mínimo que exige la normativa laboral
        colombiana para efectos de prueba, y luego se eliminan a solicitud.
      </p>

      <h2>Contacto</h2>
      <p>
        Para cualquier duda sobre esta política, escríbenos a{" "}
        <a href="mailto:soporte@turnocheck.co" className="text-primary underline">
          soporte@turnocheck.co
        </a>
        .
      </p>
    </LegalPage>
  );
}

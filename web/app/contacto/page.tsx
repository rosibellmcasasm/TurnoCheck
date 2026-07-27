import { Mail } from "lucide-react";
import { LegalPage } from "@/components/app/legal/LegalPage";

export default function ContactoPage() {
  return (
    <LegalPage title="Contacto y soporte" updated="26 de julio de 2026">
      <p>
        ¿Tienes una pregunta, un problema con tu cuenta o quieres contarnos
        algo que deberíamos mejorar? Escríbenos, un humano te responde.
      </p>
      <p className="flex items-center gap-2 text-base font-medium text-foreground">
        <Mail className="h-4.5 w-4.5 text-primary" />
        <a href="mailto:soporte@turnocheck.co" className="text-primary underline">
          soporte@turnocheck.co
        </a>
      </p>
      <p className="text-sm text-muted-foreground">
        Tiempo de respuesta habitual: menos de 24 horas hábiles.
      </p>
    </LegalPage>
  );
}

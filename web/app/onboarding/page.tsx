"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell } from "@/components/app/onboarding/OnboardingShell";
import { StepNegocio } from "@/components/app/onboarding/StepNegocio";
import { StepJornada } from "@/components/app/onboarding/StepJornada";
import { StepEquipo } from "@/components/app/onboarding/StepEquipo";
import { StepEmpleado } from "@/components/app/onboarding/StepEmpleado";
import { StepCalculando } from "@/components/app/onboarding/StepCalculando";
import { StepResultado } from "@/components/app/onboarding/StepResultado";
import {
  ONBOARDING_DEFAULT,
  readOnboarding,
  writeOnboarding,
  type OnboardingData,
} from "@/lib/onboarding-storage";

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(ONBOARDING_DEFAULT);

  useEffect(() => {
    setData(readOnboarding());
  }, []);

  function patch(update: Partial<OnboardingData>) {
    setData((prev) => {
      const next = { ...prev, ...update };
      writeOnboarding(next);
      return next;
    });
  }

  function goTo(n: number) {
    setStep(Math.min(Math.max(n, 1), TOTAL_STEPS));
  }

  return (
    <OnboardingShell step={Math.min(step, TOTAL_STEPS)} total={TOTAL_STEPS}>
      {step === 1 && (
        <StepNegocio data={data} onChange={patch} onNext={() => goTo(2)} />
      )}
      {step === 2 && (
        <StepJornada
          data={data}
          onChange={patch}
          onNext={() => goTo(3)}
          onBack={() => goTo(1)}
        />
      )}
      {step === 3 && (
        <StepEquipo
          data={data}
          onChange={patch}
          onNext={() => goTo(4)}
          onBack={() => goTo(2)}
        />
      )}
      {step === 4 && (
        <StepEmpleado
          data={data}
          onChange={patch}
          onNext={() => goTo(5)}
          onBack={() => goTo(3)}
        />
      )}
      {step === 5 && <StepCalculando data={data} onDone={() => goTo(6)} />}
      {step === 6 && (
        <StepResultado data={data} onNext={() => router.push("/paywall")} />
      )}
    </OnboardingShell>
  );
}

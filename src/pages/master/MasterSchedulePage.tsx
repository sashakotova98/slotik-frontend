import { useState } from "react";
import MasterScheduleStep from "../../components/master/MasterScheduleStep";
import MasterSlotStep from "../../components/master/MasterSlotStep";
import MasterDaysOff from "../../components/master/MasterDaysOff";

export default function MasterSchedulePage() {
  const [step, setStep] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Робочий графік</h1>

      <MasterScheduleStep onSlotStepLoaded={setStep} />

      {step !== null && (
        <MasterSlotStep
          value={step}
          onSaved={setStep}
        />
      )}

      <MasterDaysOff />
    </div>
  );
}

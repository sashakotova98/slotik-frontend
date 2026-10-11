import { useState } from "react";
import MasterScheduleStep from "../../components/master/MasterScheduleStep";
import MasterSlotStep from "../../components/master/MasterSlotStep";

export default function MasterSchedulePage() {
  const [step, setStep] = useState(30);

  function handleSaved(newStep: number) {
    setStep(newStep);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Робочий графік</h1>
      <MasterScheduleStep />
      <MasterSlotStep value={step} onSaved={handleSaved} />
    </div>
  );
}

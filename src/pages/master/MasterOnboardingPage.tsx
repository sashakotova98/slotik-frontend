import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MasterProfileStep from "../../components/master/MasterProfileStep";
import MasterServicesStep from "../../components/master/MasterServicesStep";
import MasterScheduleStep from "../../components/master/MasterScheduleStep";
import StepProgress from "../../components/master/StepProgress";
import type { UploadedPhoto } from "../../api/photos";

export default function MasterOnboardingPage() {
  const [step, setStep] = useState(1);

  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md rounded-3xl bg-white px-6 pt-6 pb-12 text-black shadow">
        <StepProgress step={step} />

        {step === 1 && (
          <MasterProfileStep
            photo={photo}
            onPhotoChange={setPhoto}
            uploading={photoUploading}
            onUploadingChange={setPhotoUploading}
          />
        )}

        {step === 2 && <MasterServicesStep />}
        {step === 3 && <MasterScheduleStep />}

        {step > 1 && (
          <button
            type="button"
            aria-label="Попередній крок"
            onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            className="absolute bottom-0 left-6 flex size-16 translate-y-1/2 items-center justify-center rounded-full bg-neutral-500/80 text-white transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            <ChevronLeft size={36} strokeWidth={2} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          aria-label="Наступний крок"
          disabled={step === 3 || photoUploading}
          onClick={() => setStep((prev) => Math.min(prev + 1, 3))}
          className="absolute bottom-0 right-6 flex size-16 translate-y-1/2 items-center justify-center rounded-full bg-neutral-500/80 text-white transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-500/80"
        >
          <ChevronRight size={36} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
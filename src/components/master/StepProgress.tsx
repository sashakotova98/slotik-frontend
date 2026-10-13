type Props = {
  step: number;
};

const stepTitles = ["Профіль", "Послуги", "Робочий графік"];

export default function StepProgress({ step }: Props) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-black">
        Крок {step} з 3 • {stepTitles[step - 1]}
      </h2>

      <div className="mt-3 flex gap-3" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-black" : "bg-neutral-300"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
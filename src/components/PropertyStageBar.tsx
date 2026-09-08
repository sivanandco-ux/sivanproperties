import { STAGE_ORDER, STAGE_LABELS, type PropertyStageValue } from "@/lib/propertyStage";

export default function PropertyStageBar({
  stage,
}: {
  stage: PropertyStageValue;
}) {
  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="flex items-center w-full">
      {STAGE_ORDER.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                title={STAGE_LABELS[s]}
                className={`h-3 w-3 rounded-full shrink-0 ${
                  isCurrent
                    ? "bg-foreground ring-2 ring-offset-2 ring-offset-white dark:ring-offset-black ring-foreground"
                    : isDone
                      ? "bg-foreground"
                      : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
              <span
                className={`text-[10px] whitespace-nowrap ${
                  isCurrent ? "font-semibold" : "text-zinc-400"
                }`}
              >
                {STAGE_LABELS[s]}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 mb-4 ${
                  isDone ? "bg-foreground" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { Camera, Check, ShieldCheck, X } from 'lucide-react';
import { CALIBRATION_DOTS } from '../utils/eyeTracking';
import { BgThemeOption } from '../utils/readingSettings';

interface CalibrationModalProps {
  theme: BgThemeOption;
  status: 'starting' | 'calibrating' | 'error';
  errorMessage?: string;
  onDotClick: (dotId: number, x: number, y: number) => void;
  onComplete: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

export function CalibrationModal({
  theme,
  status,
  errorMessage,
  onDotClick,
  onComplete,
  onRetry,
  onCancel,
}: CalibrationModalProps) {
  const [clickedDots, setClickedDots] = useState<number[]>([]);

  const handleDotPress = (
    dotId: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (clickedDots.includes(dotId)) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    onDotClick(dotId, centerX, centerY);

    const nextClicked = [...clickedDots, dotId];
    setClickedDots(nextClicked);

    if (nextClicked.length >= CALIBRATION_DOTS.length) {
      onComplete();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-title"
      className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6"
      style={{
        backgroundColor: theme.pageBg,
        color: theme.textColor,
      }}
      data-testid="calibration-modal"
    >
      {/* Top Instruction Banner */}
      <div
        className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2"
            style={{
              backgroundColor: theme.primaryBg,
              borderColor: theme.primaryBorder,
              color: theme.primaryIconColor,
            }}
            aria-hidden="true"
          >
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h2 id="calibration-title" className="text-lg font-bold">
              {status === 'starting'
                ? 'Starting camera...'
                : status === 'error'
                  ? 'Camera needed for Eye help'
                  : 'Look at each dot and click it'}
            </h2>
            <p
              className="text-sm font-medium tabular-nums"
              style={{ color: theme.mutedTextColor }}
            >
              {status === 'calibrating'
                ? `${clickedDots.length} of ${CALIBRATION_DOTS.length} dots done`
                : 'Camera data stays in your browser and is never saved or sent anywhere.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors hover:opacity-90"
          style={{
            backgroundColor: theme.buttonBg,
            borderColor: theme.buttonBorder,
            color: theme.textColor,
          }}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Center Stage */}
      {status === 'starting' && (
        <div
          className="mx-auto max-w-md rounded-2xl border p-8 text-center"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <Camera
            className="mx-auto mb-4 h-12 w-12 animate-pulse"
            style={{ color: theme.accentColor }}
            aria-hidden="true"
          />
          <p className="text-lg font-bold">Turning on camera...</p>
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: theme.mutedTextColor }}
          >
            Allow camera access if your browser asks. Everything stays on your
            device.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div
          className="mx-auto max-w-md rounded-2xl border p-6 text-center"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <p className="text-lg font-bold">Could not open camera</p>
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: theme.mutedTextColor }}
          >
            {errorMessage ||
              'Please allow camera access in your browser to use Eye help.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] rounded-xl border-2 px-5 py-2 text-sm font-bold"
              style={{
                backgroundColor: theme.buttonBg,
                borderColor: theme.buttonBorder,
                color: theme.textColor,
              }}
            >
              Turn off Eye help
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-[44px] rounded-xl border-2 px-5 py-2 text-sm font-bold"
              style={{
                backgroundColor: theme.primaryBg,
                borderColor: theme.primaryBorder,
                color: theme.primaryText,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {status === 'calibrating' && (
        <div className="relative flex-1 w-full">
          {CALIBRATION_DOTS.map((dot) => {
            const isDone = clickedDots.includes(dot.id);
            const isNext =
              !isDone &&
              CALIBRATION_DOTS.find((d) => !clickedDots.includes(d.id))?.id ===
                dot.id;

            return (
              <button
                key={dot.id}
                type="button"
                onClick={(e) => handleDotPress(dot.id, e)}
                disabled={isDone}
                aria-label={`Calibration dot ${dot.id}: ${dot.label}${
                  isDone ? ' (done)' : ''
                }`}
                data-testid={`calibration-dot-${dot.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full border-4 font-bold transition-transform hover:scale-105 disabled:cursor-default"
                style={{
                  left: `${dot.xPercent}%`,
                  top: `${dot.yPercent}%`,
                  backgroundColor: isDone
                    ? theme.cardBg
                    : isNext
                      ? theme.accentColor
                      : theme.buttonBg,
                  borderColor: isDone
                    ? theme.accentColor
                    : isNext
                      ? theme.textColor
                      : theme.buttonBorder,
                  color: isDone
                    ? theme.accentColor
                    : isNext
                      ? theme.isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : theme.textColor,
                }}
              >
                {isDone ? (
                  <Check className="h-6 w-6 stroke-[3]" aria-hidden="true" />
                ) : (
                  <span className="text-base tabular-nums">{dot.id}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Privacy footer */}
      <div
        className="mx-auto flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
          color: theme.mutedTextColor,
        }}
      >
        <ShieldCheck
          className="h-4 w-4 shrink-0"
          style={{ color: theme.accentColor }}
          aria-hidden="true"
        />
        <span>
          Privacy: Video stays in your browser and is never saved or sent
          anywhere.
        </span>
      </div>
    </div>
  );
}

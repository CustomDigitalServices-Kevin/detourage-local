import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useLocale } from "../i18n/locale-context";
import type { Point, RgbaImage } from "../lib";
import { drawRgbaToCanvas } from "./studio/canvas-render";
import { clientPointToImage, displayRadiusToImage } from "./studio/pointer-math";

export interface StrokeSegment {
  readonly from: Point;
  readonly to: Point;
  /** Brush radius already converted to image-space pixels. */
  readonly radius: number;
}

interface PreviewPanelsProps {
  original: RgbaImage;
  result: RgbaImage;
  /** When true, the result canvas paints strokes and emits them via onStroke. */
  brushEnabled: boolean;
  /** Brush radius in displayed (CSS) pixels, converted per event to image space. */
  brushDisplaySize: number;
  onStroke: (segment: StrokeSegment) => void;
}

export function PreviewPanels({
  original,
  result,
  brushEnabled,
  brushDisplaySize,
  onStroke,
}: PreviewPanelsProps): ReactElement {
  const { t } = useLocale();
  const originalCanvas = useRef<HTMLCanvasElement>(null);
  const resultCanvas = useRef<HTMLCanvasElement>(null);
  const lastPoint = useRef<Point | null>(null);

  useEffect(() => {
    if (originalCanvas.current !== null) drawRgbaToCanvas(originalCanvas.current, original);
  }, [original]);

  useEffect(() => {
    if (resultCanvas.current !== null) drawRgbaToCanvas(resultCanvas.current, result);
  }, [result]);

  const imageWidth = original.width;
  const imageHeight = original.height;

  const pointAt = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>): { point: Point; radius: number } => {
      const size = { width: imageWidth, height: imageHeight };
      const rect = event.currentTarget.getBoundingClientRect();
      const point = clientPointToImage(event.clientX, event.clientY, rect, size);
      const radius = displayRadiusToImage(brushDisplaySize, rect, size);
      return { point, radius };
    },
    [brushDisplaySize, imageWidth, imageHeight],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!brushEnabled) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const { point, radius } = pointAt(event);
      lastPoint.current = point;
      // A single tap paints one dab (from === to).
      onStroke({ from: point, to: point, radius });
    },
    [brushEnabled, onStroke, pointAt],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!brushEnabled || lastPoint.current === null) return;
      const { point, radius } = pointAt(event);
      onStroke({ from: lastPoint.current, to: point, radius });
      lastPoint.current = point;
    },
    [brushEnabled, onStroke, pointAt],
  );

  const endStroke = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    lastPoint.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <figure className="flex flex-col gap-2">
        <figcaption className="text-[12px] font-semibold text-faint">{t("editor.before")}</figcaption>
        <div className="alpha-checkerboard overflow-hidden rounded-xl border border-line">
          <canvas ref={originalCanvas} className="block h-auto w-full" aria-label={t("editor.before")} />
        </div>
      </figure>

      <figure className="flex flex-col gap-2">
        <figcaption className="text-[12px] font-semibold text-faint">{t("editor.after")}</figcaption>
        <div className="alpha-checkerboard overflow-hidden rounded-xl border border-line">
          <canvas
            ref={resultCanvas}
            data-testid="result-canvas"
            className={`block h-auto w-full touch-none ${brushEnabled ? "cursor-crosshair" : ""}`}
            aria-label={t("editor.after")}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={endStroke}
          />
        </div>
      </figure>
    </div>
  );
}

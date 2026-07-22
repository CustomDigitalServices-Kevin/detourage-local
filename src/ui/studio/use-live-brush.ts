import { useCallback, useEffect, useRef, useState } from "react";
import type { BrushMode, Mask } from "../../lib";
import { paintStroke } from "../../lib";
import type { StrokeSegment } from "../PreviewPanels";

export interface LiveBrushConfig {
  readonly hardness: number;
  readonly mode: BrushMode;
}

export interface LiveBrush {
  /** The matte to render right now (live during a stroke, committed between). */
  readonly mask: Mask;
  /** Queue one stroke segment; painting is coalesced to one commit per frame. */
  paint(segment: StrokeSegment): void;
}

/**
 * Brush editing that stays responsive on large images. Pointer moves fire far
 * faster than a full-resolution composite can keep up, so segments are queued
 * and flushed once per animation frame: every queued segment is applied in
 * order (edits never drop) but the matte is committed — and the preview
 * re-rendered — at most 60×/s. External matte changes (reset, switching image)
 * are detected by reference and re-synced without fighting our own commits.
 */
export function useLiveBrush(
  committed: Mask,
  config: LiveBrushConfig,
  onCommit: (mask: Mask) => void,
): LiveBrush {
  const [mask, setMask] = useState<Mask>(committed);
  const workingRef = useRef<Mask>(committed);
  const lastCommittedRef = useRef<Mask>(committed);
  const queueRef = useRef<StrokeSegment[]>([]);
  const frameRef = useRef<number | null>(null);

  const configRef = useRef<LiveBrushConfig>(config);
  configRef.current = config;
  const onCommitRef = useRef<(mask: Mask) => void>(onCommit);
  onCommitRef.current = onCommit;

  // Re-sync only on genuinely external matte changes (a new cutout, a reset),
  // never on the commits we make ourselves — those already match the ref.
  useEffect(() => {
    if (committed !== lastCommittedRef.current) {
      workingRef.current = committed;
      lastCommittedRef.current = committed;
      setMask(committed);
    }
  }, [committed]);

  const flush = useCallback((): void => {
    frameRef.current = null;
    const segments = queueRef.current;
    queueRef.current = [];
    if (segments.length === 0) return;

    const { hardness, mode } = configRef.current;
    let next = workingRef.current;
    for (const segment of segments) {
      next = paintStroke(next, segment.from, segment.to, {
        radius: segment.radius,
        hardness,
        mode,
      });
    }
    workingRef.current = next;
    lastCommittedRef.current = next;
    setMask(next);
    onCommitRef.current(next);
  }, []);

  const paint = useCallback(
    (segment: StrokeSegment): void => {
      queueRef.current.push(segment);
      frameRef.current ??= requestAnimationFrame(flush);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return { mask, paint };
}

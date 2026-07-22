import { useCallback, useReducer, useRef, useState } from "react";
import type { Backend, Mask } from "../../lib";
import { DecodeError } from "../../lib";
import type { CutoutEngine } from "./cutout-engine";
import { createCutoutEngine } from "./cutout-engine";
import type { CutoutMap } from "./cutouts-reducer";
import { cutoutsReducer, EMPTY_CUTOUTS, pendingIds } from "./cutouts-reducer";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface ModelState {
  readonly status: ModelStatus;
  /** Download completion 0..1 while loading. */
  readonly fraction: number;
  /** Backend chosen once loading starts, else null. */
  readonly backend: Backend | null;
}

export interface StudioApi {
  readonly cutouts: CutoutMap;
  readonly model: ModelState;
  /** Run the cutout for one image (loading the model first if needed). */
  process(id: string, file: File): Promise<void>;
  /** Run every image that has not yet succeeded, reusing the loaded session. */
  processAll(images: readonly { id: string; file: File }[]): Promise<void>;
  /** Replace the working matte of a ready image (brush edit). */
  setMask(id: string, mask: Mask): void;
  /** Restore the working matte to the raw model output. */
  resetMask(id: string): void;
  /** Drop one image's cutout state. */
  remove(id: string): void;
  /** Drop every cutout. */
  clear(): void;
}

const INITIAL_MODEL: ModelState = { status: "idle", fraction: 0, backend: null };

function errorCode(error: unknown): "decode" | "generic" {
  return error instanceof DecodeError ? "decode" : "generic";
}

/**
 * Owns the whole processing side of the studio: a single reused CutoutEngine,
 * the model-load lifecycle, and the per-image cutout map. The engine is created
 * lazily (and injectably) so nothing heavy is constructed until the first
 * cutout, and so tests can supply a deterministic fake.
 */
export function useStudio(createEngine: () => CutoutEngine = createCutoutEngine): StudioApi {
  const [cutouts, dispatch] = useReducer(cutoutsReducer, EMPTY_CUTOUTS);
  const [model, setModel] = useState<ModelState>(INITIAL_MODEL);

  const engineRef = useRef<CutoutEngine | null>(null);
  const loadRef = useRef<Promise<void> | null>(null);

  const getEngine = useCallback((): CutoutEngine => {
    engineRef.current ??= createEngine();
    return engineRef.current;
  }, [createEngine]);

  const ensureLoaded = useCallback(async (): Promise<CutoutEngine> => {
    const engine = getEngine();
    loadRef.current ??= (async (): Promise<void> => {
      setModel({ status: "loading", fraction: 0, backend: null });
      await engine.load((progress) => {
        setModel({
          status: progress.ready ? "ready" : "loading",
          fraction: progress.fraction,
          backend: engine.backend,
        });
      });
      setModel({ status: "ready", fraction: 1, backend: engine.backend });
    })();

    try {
      await loadRef.current;
    } catch (error) {
      // Allow a later retry: clear the memoised promise and surface the error.
      loadRef.current = null;
      setModel({ status: "error", fraction: 0, backend: engine.backend });
      throw error;
    }
    return engine;
  }, [getEngine]);

  const process = useCallback(
    async (id: string, file: File): Promise<void> => {
      dispatch({ type: "start", id });
      let engine: CutoutEngine;
      try {
        engine = await ensureLoaded();
      } catch {
        dispatch({ type: "fail", id, code: "generic" });
        return;
      }
      try {
        const cutout = await engine.cutout(file);
        dispatch({ type: "succeed", id, original: cutout.original, mask: cutout.mask });
      } catch (error) {
        dispatch({ type: "fail", id, code: errorCode(error) });
      }
    },
    [ensureLoaded],
  );

  const cutoutsRef = useRef<CutoutMap>(cutouts);
  cutoutsRef.current = cutouts;

  const processAll = useCallback(
    async (images: readonly { id: string; file: File }[]): Promise<void> => {
      const targets = pendingIds(
        images.map((image) => image.id),
        cutoutsRef.current,
      );
      const targetSet = new Set(targets);
      // Sequential: a shared ONNX session cannot run two inferences at once, and
      // this keeps peak memory to a single image's tensors.
      for (const image of images) {
        if (targetSet.has(image.id)) {
          await process(image.id, image.file);
        }
      }
    },
    [process],
  );

  const setMask = useCallback((id: string, mask: Mask): void => {
    dispatch({ type: "setMask", id, mask });
  }, []);
  const resetMask = useCallback((id: string): void => {
    dispatch({ type: "resetMask", id });
  }, []);
  const remove = useCallback((id: string): void => {
    dispatch({ type: "remove", id });
  }, []);
  const clear = useCallback((): void => {
    dispatch({ type: "clear" });
  }, []);

  return { cutouts, model, process, processAll, setMask, resetMask, remove, clear };
}

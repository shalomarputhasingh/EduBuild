import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads TensorFlow.js and MobileNet on demand.
 *
 * The imports are dynamic and only run when `load()` is called — which happens
 * when the teacher presses "Start scanner", never on mount. Previously a
 * useEffect fetched the model the moment the route rendered, so simply
 * navigating to /scanner pulled roughly 4MB of JavaScript and 17MB of weights
 * whether or not anyone intended to scan anything.
 */
export const useMobileNet = () => {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);

  const modelRef = useRef(null);
  const tfRef = useRef(null);
  const loadingPromise = useRef(null);

  const load = useCallback(async () => {
    if (modelRef.current) return modelRef.current;
    // Concurrent callers share one download rather than starting several.
    if (loadingPromise.current) return loadingPromise.current;

    setStatus('loading');
    setError(null);

    loadingPromise.current = (async () => {
      try {
        const [tf, mobilenet] = await Promise.all([
          import('@tensorflow/tfjs'),
          import('@tensorflow-models/mobilenet'),
        ]);

        // WebGL is dramatically faster, but fall back rather than fail outright
        // on machines without it.
        try {
          await tf.setBackend('webgl');
        } catch {
          await tf.setBackend('cpu');
        }
        await tf.ready();

        const model = await mobilenet.load({ version: 2, alpha: 1.0 });

        tfRef.current = tf;
        modelRef.current = model;
        setStatus('ready');
        return model;
      } catch (err) {
        setError(
          'The scanner model could not be loaded. Check your connection and try again — it is a large download the first time.'
        );
        setStatus('error');
        loadingPromise.current = null;
        throw err;
      }
    })();

    return loadingPromise.current;
  }, []);

  /** @returns {Promise<Array<{className, probability}>>} top predictions */
  const classify = useCallback(
    async (imageElement, topK = 3) => {
      const model = modelRef.current || (await load());
      if (!model || !imageElement) return [];
      return model.classify(imageElement, topK);
    },
    [load]
  );

  // Free the GPU textures the model holds when the scanner unmounts. Without
  // this they survive until the tab is closed.
  useEffect(
    () => () => {
      try {
        modelRef.current?.model?.dispose?.();
        tfRef.current?.disposeVariables?.();
      } catch {
        // Disposal is best-effort; a failure here must not break unmounting.
      }
      modelRef.current = null;
      loadingPromise.current = null;
    },
    []
  );

  return { status, error, load, classify, isReady: status === 'ready' };
};

export default useMobileNet;

import { useState, useEffect, useRef } from 'react';
import { BuildProgressEvent, BuildRecord, BuildStatus } from '../types';
import { API_BASE } from '../services/api';

export function useBuildProgress(buildId: string | null) {
  const [status, setStatus] = useState<BuildStatus>('pending');
  const [stage, setStage] = useState<string>('Initializing build...');
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(8);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [build, setBuild] = useState<BuildRecord | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!buildId) {
      setStatus('pending');
      setStage('Initializing build...');
      setStepIndex(0);
      setProgressPercent(0);
      setLogs([]);
      setError(null);
      setBuild(null);
      setIsDone(false);
      return;
    }

    const eventSource = new EventSource(`${API_BASE}/builds/${buildId}/status`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'snapshot') {
          setBuild(data.build);
          setStatus(data.build.status);
          if (data.build.logs) {
            setLogs(data.build.logs.split('\n'));
          }
        } else if (data.type === 'progress') {
          const ev: BuildProgressEvent = data.event;
          setStage(ev.stage);
          setStepIndex(ev.stepIndex);
          setTotalSteps(ev.totalSteps);
          setProgressPercent(ev.progressPercent);
          setStatus(ev.status);
          if (ev.error) {
            setError(ev.error);
          }
        } else if (data.type === 'log') {
          setLogs((prev) => [...prev, data.log]);
        } else if (data.type === 'done') {
          setIsDone(true);
          setStatus(data.status);
          eventSource.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE event', err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [buildId]);

  return {
    status,
    stage,
    stepIndex,
    totalSteps,
    progressPercent,
    logs,
    error,
    build,
    isDone
  };
}


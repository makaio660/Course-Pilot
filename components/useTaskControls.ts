"use client";

import { useEffect, useMemo, useState } from "react";
import type { Assignment } from "@/lib/types";

type TaskControlState = {
  hiddenIds: string[];
  priorityOverrides: Record<string, number>;
};

const emptyState: TaskControlState = {
  hiddenIds: [],
  priorityOverrides: {}
};

const storageKey = "coursepilot-task-controls";

export function useTaskControls<T extends Assignment>(assignments: T[]) {
  const [state, setState] = useState<TaskControlState>(emptyState);
  const [history, setHistory] = useState<TaskControlState[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setState(JSON.parse(saved));
    } catch {
      setState(emptyState);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [loaded, state]);

  const managedAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => !state.hiddenIds.includes(assignment.id))
      .map((assignment) => ({
        ...assignment,
        priorityScore: state.priorityOverrides[assignment.id] ?? assignment.priorityScore,
        userPriorityOverride: state.priorityOverrides[assignment.id]
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [assignments, state]);

  function push(next: TaskControlState) {
    setHistory((items) => [...items.slice(-9), state]);
    setState(next);
  }

  function deleteTask(id: string) {
    push({ ...state, hiddenIds: [...new Set([...state.hiddenIds, id])] });
  }

  function changePriority(id: string, delta: number) {
    const assignment = assignments.find((item) => item.id === id);
    if (!assignment) return;
    const current = state.priorityOverrides[id] ?? assignment.priorityScore;
    const nextScore = Math.max(0, Math.min(100, current + delta));
    push({ ...state, priorityOverrides: { ...state.priorityOverrides, [id]: nextScore } });
  }

  function clearPriority(id: string) {
    const nextOverrides = { ...state.priorityOverrides };
    delete nextOverrides[id];
    push({ ...state, priorityOverrides: nextOverrides });
  }

  function undo() {
    setHistory((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setState(previous);
      return items.slice(0, -1);
    });
  }

  function reset() {
    push(emptyState);
  }

  return {
    managedAssignments,
    hiddenCount: state.hiddenIds.length,
    hasChanges: state.hiddenIds.length > 0 || Object.keys(state.priorityOverrides).length > 0,
    canUndo: history.length > 0,
    deleteTask,
    upgradePriority: (id: string) => changePriority(id, 10),
    downgradePriority: (id: string) => changePriority(id, -10),
    clearPriority,
    undo,
    reset
  };
}

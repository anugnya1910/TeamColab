import { useCallback } from 'react';
import api, { errMsg } from '../api/axios';
import { useToast } from '../context/ToastContext';
import { emitDataChanged } from './useApi';

// Optimistic status updates shared by the Kanban board and task lists
export function useTaskActions(setTasks) {
  const toast = useToast();

  const moveTask = useCallback(
    async (task, status) => {
      if (task.status === status) return;
      setTasks?.((prev) => (Array.isArray(prev) ? prev.map((t) => (t._id === task._id ? { ...t, status } : t)) : prev));
      try {
        await api.patch(`/tasks/${task._id}/status`, { status });
        toast.success(status === 'Done' ? `"${task.title}" completed` : `Moved to ${status}`);
      } catch (e) {
        toast.error(errMsg(e, 'Could not update the task'));
      } finally {
        emitDataChanged();
      }
    },
    [setTasks, toast]
  );

  const toggleDone = useCallback((task) => moveTask(task, task.status === 'Done' ? 'Todo' : 'Done'), [moveTask]);

  return { moveTask, toggleDone };
}

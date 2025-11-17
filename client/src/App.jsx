import { useEffect, useState } from 'react';
import './App.css';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { fetchTasks, createTask, updateTask, deleteTask } from './api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchTasks();
        setTasks(data);
      } catch (err) {
        setError(err.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const handleCreateTask = async (task) => {
    setIsMutating(true);
    setError('');
    try {
      const created = await createTask(task);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message || 'Unable to create task');
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setIsMutating(true);
    setError('');
    try {
      const updated = await updateTask(id, { status });
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
    } catch (err) {
      setError(err.message || 'Unable to update task');
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteTask = async (id) => {
    setIsMutating(true);
    setError('');
    try {
      await deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(err.message || 'Unable to delete task');
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Task Manager</h1>
        <p>Track assignments, priorities, and due dates from one dashboard.</p>
      </header>

      {error && <p className="app-error">{error}</p>}

      <div className="layout">
        <TaskForm onCreate={handleCreateTask} isSubmitting={isMutating} />

        <section className="task-section">
          <div className="section-heading">
            <h2>Tasks</h2>
            {loading ? <span className="pill">Loading...</span> : <span className="pill">{tasks.length} total</span>}
          </div>
          {loading ? <p className="empty-state">Loading tasks...</p> : (
            <TaskList
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              isMutating={isMutating}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default App;

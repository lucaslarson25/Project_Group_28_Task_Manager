import { useCallback, useEffect, useState } from 'react';
import './App.css';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import FilterPanel from './components/FilterPanel';
import SortingControls from './components/SortingControls';
import Dashboard from './components/Dashboard';
import UserForm from './components/UserForm';
import { fetchTasks, createTask, updateTask, deleteTask, assignTask } from './api/tasks';
import { fetchUsers, createUser } from './api/users';
import { fetchSummaryAnalytics, fetchUserAnalytics } from './api/analytics';

const defaultFilters = {
  status: '',
  priority: '',
  assignedTo: '',
  dueBefore: '',
  dueAfter: '',
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState('due_date');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userAnalytics, setUserAnalytics] = useState(null);
  const refreshIntervalMs = 15000;

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchSummaryAnalytics();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    }
  }, []);

  const loadTasks = useCallback(
    async (options = { showSpinner: true }) => {
      const { showSpinner = true } = options;
      try {
        if (showSpinner) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        setError('');
        const data = await fetchTasks(filters, sort);
        setTasks(data);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        setError(err.message || 'Failed to load tasks');
      } finally {
        if (showSpinner) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [filters, sort]
  );

  useEffect(() => {
    loadUsers();
    loadSummary();
  }, [loadUsers, loadSummary]);

  useEffect(() => {
    loadTasks({ showSpinner: true });
  }, [loadTasks]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadTasks({ showSpinner: false });
      loadSummary();
    }, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [loadTasks, loadSummary]);

  useEffect(() => {
    if (!selectedUserId) {
      setUserAnalytics(null);
      return;
    }

    const loadUserData = async () => {
      try {
        const data = await fetchUserAnalytics(selectedUserId);
        setUserAnalytics(data);
      } catch (err) {
        setError(err.message || 'Failed to load user analytics');
      }
    };

    loadUserData();
  }, [selectedUserId]);

  const replaceTask = (updated) => {
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
  };

  const handleCreateTask = async (task) => {
    setIsMutating(true);
    setError('');
    try {
      const created = await createTask(task);
      setTasks((prev) => [created, ...prev]);
      await loadSummary();
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
      replaceTask(updated);
      await loadSummary();
      if (selectedUserId) {
        const data = await fetchUserAnalytics(selectedUserId);
        setUserAnalytics(data);
      }
    } catch (err) {
      setError(err.message || 'Unable to update task');
    } finally {
      setIsMutating(false);
    }
  };

  const handleAssign = async (id, payload) => {
    setIsMutating(true);
    setError('');
    try {
      const updated = await assignTask(id, payload);
      replaceTask(updated);
      await loadSummary();
      if (selectedUserId) {
        const data = await fetchUserAnalytics(selectedUserId);
        setUserAnalytics(data);
      }
    } catch (err) {
      setError(err.message || 'Unable to assign task');
    } finally {
      setIsMutating(false);
    }
  };

  const handleCreateUser = async (user) => {
    setIsMutating(true);
    setError('');
    try {
      await createUser(user);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to create user');
      throw err;
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
      await loadSummary();
    } catch (err) {
      setError(err.message || 'Unable to delete task');
    } finally {
      setIsMutating(false);
    }
  };

  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
  };

  const handleSortChange = (nextSort) => {
    setSort(nextSort);
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Task Manager</h1>
        <p>Track assignments, priorities, and due dates from one dashboard.</p>
        <div className="status-row">
          <span className="pill">{refreshing ? 'Auto-refreshing…' : 'Live updates on'}</span>
          {lastUpdated && <span className="pill muted">Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
        </div>
      </header>

      {error && <p className="app-error">{error}</p>}

      <div className="layout">
        <aside className="side-panel">
          <TaskForm onCreate={handleCreateTask} isSubmitting={isMutating} users={users} />
          <UserForm onCreate={handleCreateUser} isSubmitting={isMutating} />
          <FilterPanel
            filters={filters}
            users={users}
            onChange={handleFilterChange}
            onClear={() => setFilters(defaultFilters)}
          />
          <SortingControls sort={sort} onChange={handleSortChange} />
        </aside>

        <section className="main-panel">
          <Dashboard
            summary={summary}
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            userAnalytics={userAnalytics}
          />

          <section className="task-section">
            <div className="section-heading">
              <h2>Tasks</h2>
              {loading ? (
                <span className="pill">Loading...</span>
              ) : (
                <span className="pill">{tasks.length} shown</span>
              )}
            </div>
            {loading ? (
              <p className="empty-state">Loading tasks...</p>
            ) : (
              <TaskList
                tasks={tasks}
                users={users}
                onStatusChange={handleStatusChange}
                onAssign={handleAssign}
                onDelete={handleDeleteTask}
                isMutating={isMutating}
              />
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

export default App;

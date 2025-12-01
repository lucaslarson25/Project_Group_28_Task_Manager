import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#ef4444'];

const formatDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

function Dashboard({ summary, users, selectedUserId, onSelectUser, userAnalytics }) {
  if (!summary) {
    return (
      <section className="dashboard">
        <p className="muted">Loading analytics…</p>
      </section>
    );
  }

  const completionData = [
    { name: 'Completed', value: summary.completed || 0 },
    { name: 'Open', value: Math.max(0, (summary.total || 0) - (summary.completed || 0)) },
    { name: 'Overdue', value: summary.overdue || 0 },
  ];

  const overdueData = [
    { name: 'Open', value: summary.open || 0 },
    { name: 'Overdue', value: summary.overdue || 0 },
  ];

  return (
    <section className="dashboard">
      <div className="stat-grid">
        <div className="stat-card">
          <p className="label">Total tasks</p>
          <p className="value">{summary.total ?? '-'}</p>
        </div>
        <div className="stat-card">
          <p className="label">Completed</p>
          <p className="value success">{summary.completed ?? '-'}</p>
        </div>
        <div className="stat-card">
          <p className="label">Overdue</p>
          <p className="value danger">{summary.overdue ?? '-'}</p>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="section-heading">
            <h3>Completion</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={completionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="section-heading">
            <h3>Open vs Overdue</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={overdueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <div className="section-heading">
            <h3>Upcoming deadlines (7 days)</h3>
          </div>
          {summary.upcoming?.length ? (
            <ul className="upcoming-list">
              {summary.upcoming.map((task) => (
                <li key={task.id}>
                  <div>
                    <p className="assignee__name">{task.title}</p>
                    <p className="assignee__email">{task.assignedUser?.name || 'Unassigned'}</p>
                  </div>
                  <span className="pill">{formatDate(task.dueDate)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No deadlines in the next week.</p>
          )}
        </div>

        <div className="chart-card">
          <div className="section-heading">
            <h3>User workload</h3>
            <select
              className="heading-select"
              value={selectedUserId}
              onChange={(event) => onSelectUser(event.target.value)}
            >
              <option value="">Pick a user</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          {selectedUserId && userAnalytics ? (
            <div className="stat-grid compact">
              <div className="stat-card">
                <p className="label">Assigned</p>
                <p className="value">{userAnalytics.assigned}</p>
              </div>
              <div className="stat-card">
                <p className="label">Completed</p>
                <p className="value success">{userAnalytics.completed}</p>
              </div>
              <div className="stat-card">
                <p className="label">Overdue</p>
                <p className="value danger">{userAnalytics.overdue}</p>
              </div>
            </div>
          ) : (
            <p className="muted">Select a user to view their stats.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;

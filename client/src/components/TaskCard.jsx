const formatDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const statusLabel = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const priorityLabel = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
};

function TaskCard({ task, users, onStatusChange, onAssign, onDelete, isMutating }) {
  const handleStatusSelect = (event) => {
    onStatusChange(task.id, event.target.value);
  };

  const handleAssignSelect = (event) => {
    const value = event.target.value;
    onAssign(task.id, { assignedUserId: value ? Number(value) : null });
  };

  return (
    <li className="task-card">
      <div className="task-card__header">
        <div>
          <p className="task-card__title">{task.title}</p>
          <div className="task-card__meta">
            <span className={`pill pill-status-${task.status}`}>{statusLabel[task.status] || 'Open'}</span>
            <span className={`pill pill-priority-${task.priority}`}>
              Priority: {priorityLabel[task.priority] || 'Normal'}
            </span>
            <span className="muted">{formatDate(task.dueDate)}</span>
          </div>
        </div>
        <div className="task-card__actions">
          <button type="button" onClick={() => onDelete(task.id)} disabled={isMutating} className="danger">
            Delete
          </button>
        </div>
      </div>

      {task.description && <p className="task-card__description">{task.description}</p>}

      <div className="task-card__footer">
        <div className="assignee">
          <div className="avatar">{getInitials(task.assignedUser?.name)}</div>
          <div>
            <p className="assignee__name">{task.assignedUser?.name || 'Unassigned'}</p>
            <p className="assignee__email">{task.assignedUser?.email || 'No collaborator selected'}</p>
          </div>
        </div>
        <label className="inline-control">
          Assigned user
          <select
            value={task.assignedUserId || ''}
            onChange={handleAssignSelect}
            disabled={isMutating}
          >
            <option value="">Unassigned</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-control">
          Status
          <select value={task.status} onChange={handleStatusSelect} disabled={isMutating}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
    </li>
  );
}

export default TaskCard;

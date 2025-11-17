const formatDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const renderStatus = (status) => {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Open';
  }
};

const renderPriority = (priority) => {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'high':
      return 'High';
    default:
      return 'Normal';
  }
};

function TaskList({ tasks, onStatusChange, onDelete, isMutating }) {
  if (tasks.length === 0) {
    return <p className="empty-state">No tasks yet. Create one to get started.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-card">
          <div className="task-card__header">
            <div>
              <p className="task-card__title">{task.title}</p>
              <p className="task-card__meta">
                {renderStatus(task.status)} | Priority: {renderPriority(task.priority)} | {formatDate(task.dueDate)}
              </p>
            </div>
            <div className="task-card__actions">
              {task.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => onStatusChange(task.id, 'completed')}
                  disabled={isMutating}
                  className="secondary"
                >
                  Mark complete
                </button>
              )}
              <button type="button" onClick={() => onDelete(task.id)} disabled={isMutating} className="danger">
                Delete
              </button>
            </div>
          </div>

          {task.description && <p className="task-card__description">{task.description}</p>}

          <div className="task-card__footer">
            <span>Assigned to: {task.assignedTo || 'Unassigned'}</span>
            <span>Updated: {formatDate(task.updatedAt || task.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;

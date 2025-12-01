import TaskCard from './TaskCard';

function TaskList({ tasks, users, onStatusChange, onAssign, onDelete, isMutating }) {
  if (tasks.length === 0) {
    return <p className="empty-state">No tasks match the current filters.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          users={users}
          onStatusChange={onStatusChange}
          onAssign={onAssign}
          onDelete={onDelete}
          isMutating={isMutating}
        />
      ))}
    </ul>
  );
}

export default TaskList;

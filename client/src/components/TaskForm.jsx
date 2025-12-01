import { useState } from 'react';

const createDefaultTask = () => ({
  title: '',
  description: '',
  dueDate: '',
  priority: 'normal',
  status: 'open',
  assignedUserId: '',
});

function TaskForm({ onCreate, isSubmitting, users }) {
  const [task, setTask] = useState(createDefaultTask);
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setTask((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!task.title.trim()) {
      setFormError('Please provide a title for the task.');
      return;
    }

    try {
      const payload = {
        ...task,
        assignedUserId: task.assignedUserId ? Number(task.assignedUserId) : null,
      };
      await onCreate(payload);
      setTask(createDefaultTask());
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Create a Task</h2>

      <label>
        Title
        <input
          name="title"
          value={task.title}
          onChange={handleChange}
          placeholder="Set up project repo"
          disabled={isSubmitting}
          required
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          value={task.description}
          onChange={handleChange}
          placeholder="Add more context or acceptance criteria"
          rows={3}
          disabled={isSubmitting}
        />
      </label>

      <div className="form-grid">
        <label>
          Due date
          <input
            type="date"
            name="dueDate"
            value={task.dueDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </label>

        <label>
          Priority
          <select name="priority" value={task.priority} onChange={handleChange} disabled={isSubmitting}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Status
          <select name="status" value={task.status} onChange={handleChange} disabled={isSubmitting}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label>
          Assigned user
          <select
            name="assignedUserId"
            value={task.assignedUserId}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="">Unassigned</option>
            {users?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {formError && <p className="form-error">{formError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add Task'}
      </button>
    </form>
  );
}

export default TaskForm;

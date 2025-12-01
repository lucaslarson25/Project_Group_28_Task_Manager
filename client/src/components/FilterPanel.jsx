function FilterPanel({ filters, users, onChange, onClear }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <h3>Filters</h3>
        <button type="button" className="link-button" onClick={onClear}>
          Clear
        </button>
      </div>

      <label>
        Status
        <select name="status" value={filters.status} onChange={handleChange}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label>
        Priority
        <select name="priority" value={filters.priority} onChange={handleChange}>
          <option value="">All</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </label>

      <label>
        Assigned user
        <select name="assignedTo" value={filters.assignedTo} onChange={handleChange}>
          <option value="">All</option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>

      <div className="form-grid condensed">
        <label>
          Due after
          <input type="date" name="dueAfter" value={filters.dueAfter} onChange={handleChange} />
        </label>
        <label>
          Due before
          <input type="date" name="dueBefore" value={filters.dueBefore} onChange={handleChange} />
        </label>
      </div>
    </section>
  );
}

export default FilterPanel;

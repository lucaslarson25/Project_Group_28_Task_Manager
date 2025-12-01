function SortingControls({ sort, onChange }) {
  return (
    <section className="panel">
      <h3>Sort & Order</h3>
      <label>
        Order by
        <select value={sort} onChange={(event) => onChange(event.target.value)}>
          <option value="due_date">Due date</option>
          <option value="priority">Priority</option>
          <option value="user">Assigned user</option>
        </select>
      </label>
    </section>
  );
}

export default SortingControls;

import { useState } from 'react';

const createDefaultUser = () => ({
  name: '',
  email: '',
});

function UserForm({ onCreate, isSubmitting }) {
  const [form, setForm] = useState(createDefaultUser);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      await onCreate({ ...form, email: form.email.trim().toLowerCase() });
      setForm(createDefaultUser());
    } catch (err) {
      setError(err.message || 'Unable to create user');
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h3>New user</h3>
      </div>

      <label>
        Name
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          disabled={isSubmitting}
        />
      </label>

      <label>
        Email
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@example.com"
          disabled={isSubmitting}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Add User'}
      </button>
    </form>
  );
}

export default UserForm;

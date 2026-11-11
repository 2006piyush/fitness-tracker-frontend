import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { registerUser } from '../services/authService';

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      await registerUser({ email, password, firstName, lastName });
      setMessage('Registration successful. You can now login.');
      setMessageType('success');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      setMessage('Registration failed. Please try again.');
      setMessageType('error');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Register</h1>
        {message && <div className={`message ${messageType}`}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          <label>
            First name
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} type="text" />
          </label>
          <label>
            Last name
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} type="text" />
          </label>
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;

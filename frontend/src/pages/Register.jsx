// src/pages/Register.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { register, resetAuthError } from '../redux/slices/authSlice';

const SKILLS = [
  { id: 'first_aid', label: 'First Aid' },
  { id: 'cpr', label: 'CPR' },
  { id: 'fire_safety', label: 'Fire Safety' },
  { id: 'search_rescue', label: 'Search & Rescue' },
  { id: 'medical', label: 'Medical Professional' },
  { id: 'emergency_response', label: 'Emergency Response' }
];

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    skills: []
  });
  
  const [passwordError, setPasswordError] = useState('');
  
  const handleChange = (e) => {
    if (error) dispatch(resetAuthError());
    
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const updatedSkills = checked
        ? [...formData.skills, name]
        : formData.skills.filter(skill => skill !== name);
      
      setFormData({ ...formData, skills: updatedSkills });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear password error when user types
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = formData;
    dispatch(register(registerData));
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
      
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="phone">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          />
          {passwordError && (
            <p className="text-destructive text-xs mt-1">{passwordError}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Emergency Skills (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.map(skill => (
              <div key={skill.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={skill.id}
                  name={skill.id}
                  checked={formData.skills.includes(skill.id)}
                  onChange={handleChange}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor={skill.id} className="text-sm">
                  {skill.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>{' '}
        <Link to="/login" className="text-primary hover:underline">
          Login
        </Link>
      </div>
    </div>
  );
};

export default Register;
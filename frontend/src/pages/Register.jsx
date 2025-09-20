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
  { id: 'emergency_response', label: 'Emergency Response' },
  { id: 'police_service', label: 'Police Service' },
  { id: 'NEMA', label: 'NEMA' },
  { id: 'FEMA', label: 'FEMA' },
  { id: 'shop_owner', label: 'Shop Owner' },
  { id: 'resident', label: 'Resident' }
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
      let updatedSkills;
      if (checked) {
        // only allow one skill at a time
        updatedSkills = [name];
      } else {
        updatedSkills = [];
      }
      setFormData({ ...formData, skills: updatedSkills });
    } else {
      setFormData({ ...formData, [name]: value });
    }

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
        {/* Name */}
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
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
            required
          />
        </div>

        {/* Email */}
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
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
            required
          />
        </div>

        {/* Phone */}
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
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
            required
          />
        </div>

        {/* Password */}
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
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
            required
          />
        </div>

        {/* Confirm Password */}
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
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
            required
          />
          {passwordError && (
            <p className="text-destructive text-xs mt-1">{passwordError}</p>
          )}
        </div>

        {/* Roles / Skills */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Role (Select only one)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.map(skill => {
              const isSelected = formData.skills.includes(skill.id);
              const hasSelection = formData.skills.length > 0;
              const isDisabled = !isSelected && hasSelection;

              return (
                <div
                  key={skill.id}
                  className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    id={skill.id}
                    name={skill.id}
                    checked={isSelected}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="rounded text-red-600 focus:ring-red-400"
                  />
                  <label htmlFor={skill.id} className="text-sm">
                    {skill.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-70"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">Already have an account?</span>{' '}
        <Link to="/login" className="text-red-600 hover:underline">
          Login
        </Link>
      </div>
    </div>
  );
};

export default Register;

// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, updateAvailability } from '../redux/slices/userSlice';
import { User, Check, X, AlertCircle, Save } from 'lucide-react';

const SKILLS = [
  { id: 'first_aid', label: 'First Aid' },
  { id: 'cpr', label: 'CPR' },
  { id: 'fire_safety', label: 'Fire Safety' },
  { id: 'search_rescue', label: 'Search & Rescue' },
  { id: 'medical', label: 'Medical Professional' },
  { id: 'emergency_response', label: 'Emergency Response' }
];

const Profile = () => {
  const dispatch = useDispatch();
  const { profile, loading, error } = useSelector(state => state.user);
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: []
  });
  
  // Set form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        skills: profile.skills || []
      });
    }
  }, [profile]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const updatedSkills = checked
        ? [...formData.skills, name]
        : formData.skills.filter(skill => skill !== name);
      
      setFormData({ ...formData, skills: updatedSkills });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setEditing(!editing);
    
    if (!editing) {
      // Reset form data when entering edit mode
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        skills: profile.skills || []
      });
    }
  };
  
  // Submit profile update
  const handleSubmit = (e) => {
    e.preventDefault();
    
    dispatch(updateUserProfile(formData))
      .unwrap()
      .then(() => {
        setEditing(false);
      })
      .catch(err => {
        console.error('Error updating profile:', err);
      });
  };
  
  // Toggle availability status
  const toggleAvailability = () => {
    dispatch(updateAvailability(!profile.availabilityStatus));
  };
  
  if (!profile) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="pt-8 px-8 pb-6 text-center border-b border-border">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <User size={40} />
              </div>
              
              <h3 className="text-lg font-semibold">{profile.name}</h3>
              <p className="text-muted-foreground mt-1">{profile.email}</p>
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={toggleAvailability}
                  disabled={loading}
                  className={`
                    px-4 py-2 rounded-full flex items-center text-sm font-medium
                    ${profile.availabilityStatus
                      ? 'bg-green-600/10 text-green-600 hover:bg-green-600/20'
                      : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    }
                    transition-colors
                  `}
                >
                  {profile.availabilityStatus ? (
                    <>
                      <Check size={16} className="mr-1" />
                      Available for Emergencies
                    </>
                  ) : (
                    <>
                      <X size={16} className="mr-1" />
                      Unavailable
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Phone
                  </div>
                  <div>{profile.phone || 'Not provided'}</div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Member Since
                  </div>
                  <div>
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Emergency Skills
                  </div>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map(skill => (
                        <div 
                          key={skill}
                          className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md"
                        >
                          {SKILLS.find(s => s.id === skill)?.label || skill}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No skills added</div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={toggleEditMode}
                  className="w-full bg-muted text-foreground py-2 rounded-md hover:bg-muted-foreground/20 transition-colors"
                >
                  {editing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          {editing ? (
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Edit Profile</h3>
              </div>
              
              <div className="p-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-4 text-sm flex items-start">
                    <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                    <div>{error}</div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
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
                    
                    <div>
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
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Emergency Skills
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
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-70"
                      >
                        {loading ? (
                          'Saving...'
                        ) : (
                          <>
                            <Save size={18} className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Response History</h3>
              </div>
              
              <div className="p-4">
                {profile.responseHistory && profile.responseHistory.length > 0 ? (
                  <div className="divide-y divide-border">
                    {profile.responseHistory.map((response, index) => (
                      <div key={index} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Emergency #{response.emergencyId}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Response time: {response.responseTime ? `${Math.round(response.responseTime / 60)} minutes` : 'N/A'}
                            </div>
                          </div>
                          {response.feedback && (
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < response.feedback ? 'text-yellow-500' : 'text-muted'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    You haven't responded to any emergencies yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
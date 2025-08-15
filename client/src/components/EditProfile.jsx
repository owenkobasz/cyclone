import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EditProfile() {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user'));

  if (!storedUser?.id) {
    navigate('/login');
    return;
  }
  const [name, setName] = useState(storedUser.name || '');
  const [address, setAddress] = useState(storedUser.address || '');
  const [avatarPreview, setAvatarPreview] = useState(storedUser.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch(`http://localhost:3000/api/user/profile?username=${storedUser.username}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setAddress(data.address || '');
        setAvatarPreview(data.avatar || '');
      }
    };
    fetchProfile();
  }, [storedUser.username]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id', storedUser.id);
    formData.append('name', name);
    formData.append('address', address);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const res = await fetch('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      body: formData
    });

    if (res.ok) {
      const updatedUser = await res.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/profile');
    } else {
      console.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            className="mt-1 w-full border border-gray-300 p-2 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Avatar</label>
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full mb-2 object-cover border"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
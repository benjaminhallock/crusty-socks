import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import LoadingSpinner from "../common/ui/LoadingSpinner";
import { fetchUserProfile, updateUserProfile } from "../../services/api";

const UserProfile = ({ currentUser }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });
  const isOwnProfile = currentUser && currentUser.username === username;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetchUserProfile(username);
        if (response.success && response.profile) {
          setProfile(response.profile);
          setFormData({
            displayName:
              response.profile.displayName || response.profile.username,
            bio: response.profile.bio || "",
            avatarUrl: response.profile.avatarUrl || "",
          });
        } else {
          throw new Error(response.error || "Failed to fetch profile data");
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateUserProfile(username, formData);
      if (response.success) {
        setProfile((prev) => ({
          ...prev,
          displayName: formData.displayName,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl,
        }));
        setIsEditing(false);
      } else {
        throw new Error(response.error || "Failed to update profile");
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-4 border-yellow-400">
        <div className="bg-gradient-to-r from-yellow-400 via-purple-600 to-indigo-900 dark:bg-gradient-to-r from-pink-600 via-purple-600 p-6">
          <div className="container px-6 pb-5">
            <div className="flex items-center">
              <div className="rounded-full bg-white dark:bg-gray-700 p-2 mr-4 shadow-lg border-4 border-yellow-300">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-yellow-500 dark:text-yellow-300 text-4xl font-bold">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white filter drop-shadow-lg">
                  {profile.displayName}
                </h1>
                <p className="text-yellow-200 text-lg">@{profile.username}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-lg">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border-2 border-pink-300 dark:border-pink-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-lg">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 rounded-xl border-2 border-pink-300 dark:border-pink-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2 text-lg">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl border-2 border-pink-300 dark:border-pink-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-400 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full text-lg transform transition hover:scale-105"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-red-400 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-full text-lg transform transition hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  Profile
                </h2>
                {profile.bio ? (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic mb-4 text-lg">
                    No bio provided
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl">
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      Joined:
                    </span>{" "}
                    {formatDate(profile.joinedDate)}
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-xl">
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      Last Active:
                    </span>{" "}
                    {formatDate(profile.lastActive)}
                  </div>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-6 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 font-bold py-3 px-8 rounded-full text-lg transform transition hover:scale-105"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-4">
                  Game Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-pink-100 dark:bg-pink-900/30 rounded-2xl p-4 text-center transform transition hover:scale-105">
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                      {profile.gameStats.totalScore.toLocaleString()}
                    </p>
                    <p className="text-base text-pink-600 dark:text-pink-400 font-medium">
                      Total Score
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-2xl p-4 text-center transform transition hover:scale-105">
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {profile.gameStats.gamesPlayed}
                    </p>
                    <p className="text-base text-purple-600 dark:text-purple-400 font-medium">
                      Games Played
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-4 text-center transform transition hover:scale-105">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {profile.gameStats.gamesWon}
                    </p>
                    <p className="text-base text-blue-600 dark:text-blue-400 font-medium">
                      Games Won
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-2xl p-4 text-center transform transition hover:scale-105">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {profile.gameStats.gamesPlayed > 0
                        ? Math.round(
                            (profile.gameStats.gamesWon /
                              profile.gameStats.gamesPlayed) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-base text-green-600 dark:text-green-400 font-medium">
                      Win Rate
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

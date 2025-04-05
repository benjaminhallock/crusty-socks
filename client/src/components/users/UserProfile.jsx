import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../constants";
import axios from "axios";
import LoadingSpinner from "../common/ui/LoadingSpinner";

// UserProfile component displays a user's profile
// Includes bio, avatar, game statistics, and edit functionality for own profile
const UserProfile = ({ currentUser }) => {
  const { username } = useParams(); // Get the username from the URL
  const navigate = useNavigate(); // Hook for navigation
  const [profile, setProfile] = useState(null); // State to store profile data
  const [isLoading, setIsLoading] = useState(true); // State to track loading status
  const [error, setError] = useState(null); // State to store error messages
  const [isEditing, setIsEditing] = useState(false); // State to track edit mode
  const [formData, setFormData] = useState({
    displayName: "", // Display name of the user
    bio: "", // Bio of the user
    avatarUrl: "", // Avatar URL of the user
  });

  // Determine if the current user is viewing their own profile
  const isOwnProfile = currentUser && currentUser.username === username;

  // Fetch the user's profile data when the component mounts or username changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Construct the API URL for fetching the profile
        const apiUrl = import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.GET_USER_PROFILE(
              username
            )}`
          : `${API_ENDPOINTS.GET_USER_PROFILE(username)}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found");
          }
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch user profile: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();

        if (data.success && data.profile) {
          setProfile(data.profile);
          setFormData({
            displayName: data.profile.displayName || data.profile.username,
            bio: data.profile.bio || "",
            avatarUrl: data.profile.avatarUrl || "",
          });
        } else {
          throw new Error(data.message || "Failed to fetch profile data");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Handle input changes in the edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission to update the profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      // Construct the API URL for updating the profile
      const apiUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/user/${username}`
        : `/api/user/${username}`;

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update profile: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Update the profile with the new data
        setProfile((prev) => ({
          ...prev,
          displayName: formData.displayName,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl,
        }));
        setIsEditing(false);
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Format a date string into a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
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
  }

  if (!profile) {
    return <div>No profile data found.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-900 dark:bg-gradient-to-r from-indigo-900 via-purple-900 p-6">
          <div className="container px-6 pb-5">
            <div className="flex items-center">
              <div className="rounded-full bg-white dark:bg-gray-700 p-1 mr-4 shadow-md">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-indigo-500 dark:text-indigo-300 text-4xl font-bold">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {profile.displayName}
                </h1>
                <p className="text-indigo-200">@{profile.username}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Content */}
        <div className="p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-6 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Profile Info */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Profile
                </h2>

                {profile.bio ? (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {profile.bio}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic mb-4">
                    No bio provided
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      Joined:
                    </span>{" "}
                    {formatDate(profile.joinedDate)}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      Last Active:
                    </span>{" "}
                    {formatDate(profile.lastActive)}
                  </div>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-6 bg-purple-100 hover:bg-purple-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium py-2 px-4 rounded-lg"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Game Stats */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Game Statistics
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {profile.gameStats.totalScore.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Score
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {profile.gameStats.gamesPlayed}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Games Played
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {profile.gameStats.gamesWon}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Games Won
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {profile.gameStats.gamesPlayed > 0
                        ? Math.round(
                            (profile.gameStats.gamesWon /
                              profile.gameStats.gamesPlayed) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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

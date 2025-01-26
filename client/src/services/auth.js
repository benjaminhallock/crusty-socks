if (!import.meta.env.VITE_BASE_URL) {
  console.warn(
    "VITE_BASE_URL is not defined in environment variables, using default"
  );
}
const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3001";

export const login = async (email, password) => {
  try {
    console.log("Starting login attempt for email:", email);

    console.log("Sending login request...");
    const response = await fetch(`${baseUrl}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // This enables sending cookies
    });
    console.log("Login response status:", response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log("Login failed:", data.message);
      throw new Error(data.message || "Failed to login");
    }

    console.log("Login successful, processing response data:", data);
    if (data.token && data.user?.username) {
      console.log("Storing auth data for user:", data.user.username);
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
    }
    return data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

async function checkUsername(username) {
  try {
    // Add debouncing to prevent too many requests
    if (!username || username.length < 3) return false;

    const response = await fetch(`${baseUrl}/users/check/${username}`, {
      method: "POST", // POST is preferred for security
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // If you need to handle sessions
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error("Username check failed:", error);
    throw error;
  }
}

export const register = async (email, username, password) => {
  console.log("Starting registration for username:", username);

  // Check username
  console.log("Checking if username exists...");
  const usernameCheck = await checkUsername(username);
  if (!usernameCheck) {
    throw new Error("Username check failed");
  }

  console.log("Username check result:", usernameCheck);
  console.log("Sending registration request...");
  const response = await fetch(`${baseUrl}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, username, password }),
    credentials: "include",
  });

  console.log("Registration response status:", response.status);

  if (!response.ok) {
    const data = await response.json();
    console.error("Registration error:", data);
    throw new Error(data.message || "Failed to register");
  }

  const data = await response.json();
  if (data.token && data.username) {
    console.log("Registration successful:", data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  return fetch(`${baseUrl}/users/logout`, {
    method: "POST",
    credentials: "include",
  });
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

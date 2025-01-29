const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to login");
  }

  return data;
};

export const register = async (email, username, password) => {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, username, password }),
  });

  const data = await response.json();

  console.log("register data", data);

  if (!response.ok) {
    throw new Error(data.error || "Failed to register");
  }

  return data;
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/users/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }

  return true;
};

export const checkAuth = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return false;
    }

    const response = await fetch(`${API_URL}/users/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Auth check failed:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    return false;
  }
};

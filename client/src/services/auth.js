const API_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

if (!API_URL) {
  console.error(
    "API_URL is not defined in environment variables, create a .env file in the root of the project and add VITE_SOCKET_URL"
  );
}

export const fetchLobby = async (roomId) => {
  try {
    const token = localStorage.getItem("token");
    console.log("Fetching lobby data for room:", String(roomId));
    const response = await fetch(`${API_URL}/lobby/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to fetch lobby data:", data.message);
      return { success: false, message: data.message };
    }

    return {
      success: true,
      lobby: data.lobby,
    };
  } catch (error) {
    console.error("Failed to fetch lobby data:", error);
    return { success: false, message: error.message };
  }
};

export const createLobby = async () => {
  try {
    const response = await fetch(`${API_URL}/lobby/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!data.roomId) {
      throw new Error("No room ID returned from server");
    }
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to create lobby",
      };
    }

    return {
      success: true,
      roomId: data.roomId,
      lobby: data.lobby,
    };
  } catch (error) {
    console.error("[CLIENT] Error creating lobby:", error);
    throw error;
  }
};

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
  const res = await response.json();
  if (!response.ok) {
    return {
      success: false,
      message: res.message || "Failed to register",
    };
  }
  return {
    success: true,
    user: res.user,
    token: res.token,
  };
};
export const checkAuth = async (token) => {
  if (!token) {
    return {
      success: false,
      message: "No token provided",
    };
  }

  try {
    const response = await fetch(`${API_URL}/users/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to validate token",
      };
    }

    console.log("User is authenticated:", data);

    return {
      success: true,
      user: data.user,
      token: token,
    };
  } catch (error) {
    console.error("Auth check failed:", error);
    return {
      success: false,
      message: "Network or server error",
    };
  }
};

const API_ENDPOINT = "http://localhost:3001/api/v1";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface AuthState {
  token: string | null;
  loading: boolean;
  error: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
}

const initialState: AuthState = {
  token: sessionStorage.getItem("authToken"),
  loading: false,
  error: null,
  email: null,
  firstName: null,
  lastName: null,
  userName: null,
};

// Thunk pour le login
export const loginUser = createAsyncThunk<
  string,
  { email: string; password: string }
>("auth/loginUser", async ({ email, password }) => {
  const response = await fetch(`${API_ENDPOINT}/user/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to login");
  }

  const data = await response.json();
  return data.body.token;
});

// Thunk pour récupérer toutes les infos du profil utilisateur
export const fetchUserProfile = createAsyncThunk<
  { email: string; firstName: string; lastName: string; userName: string },
  void,
  { state: RootState }
>("auth/fetchUserProfile", async (_, { getState }) => {
  const state = getState();
  const token = state.auth.token;

  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_ENDPOINT}/user/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const data = await response.json();
  return data.body;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.email = null;
      state.firstName = null;
      state.lastName = null;
      state.userName = null;
      sessionStorage.removeItem("authToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload;
        sessionStorage.setItem("authToken", action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Login failed";
      })
      // Pour gérer les infos du profil utilisateur, on ne peut pas reassigner state directement alors on utilise Object.assign pour mettre a jours plusieur champs
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        Object.assign(state, action.payload); // Mise à jour des propriétés
        console.log(action.payload);
      });
  },
});

export const { logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

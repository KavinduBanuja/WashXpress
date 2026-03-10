import { auth } from "@/firebaseConfig";
import * as SecureStore from "expo-secure-store";



async function getToken() {
  return await SecureStore.getItemAsync("accessToken");
}

async function getUserType() {
  return await SecureStore.getItemAsync("userType"); // 'customer' or 'provider'
}

async function getFreshToken(): Promise<string> {
  // Wait for Firebase to initialize auth state (important for app reopens)
  let currentUser = auth.currentUser;

  if (!currentUser) {
    // Firebase might still be initializing - wait for auth state
    currentUser = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Auth initialization timeout"));
      }, 5000); // 5 second timeout

      const unsubscribe = auth.onAuthStateChanged((user) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      });
    });
  }

  if (!currentUser) {
    throw new Error("No authenticated user");
  }

  // Get fresh token (force refresh if needed)
  const idToken = await currentUser.getIdToken(true);

  // Optional: Update stored token for consistency
  await SecureStore.setItemAsync("accessToken", idToken);

  return idToken;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit & { requiresAuth?: boolean } = {},
  userType?: 'customer' | 'provider'
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  try {
    let token: string | null = null;

    if (requiresAuth) {
      // ✅ Only get fresh token if auth is required
      token = await getFreshToken();
    }

    // Determine base URL based on userType
    const storedUserType = userType || await SecureStore.getItemAsync("userType");
    const baseURL = storedUserType === 'provider'
      ? process.env.EXPO_PUBLIC_PROVIDER_API_URL
      : process.env.EXPO_PUBLIC_CUSTOMER_API_URL;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullURL = `${baseURL}${endpoint}`;
    console.log(`🚀 API Request [${fetchOptions.method || 'GET'}] ${fullURL}`);

    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(fullURL, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP ${response.status} [${fullURL}]:`, errorText);
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      console.log(`✅ API Success [${endpoint}]`);
      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and server IP.');
      }
      throw error;
    }
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
}
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
      <Stack.Screen name="customer-home" />
      <Stack.Screen name="provider-home" />
      <Stack.Screen name="washer-home" />
      <Stack.Screen name="washer-job-request" />
      <Stack.Screen name="washer-requests" />
      <Stack.Screen name="service-browse" />
      <Stack.Screen name="service-details" />
      <Stack.Screen name="booking-details" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}



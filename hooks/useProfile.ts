import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebaseConfig';
import { CustomerProfile, getProfileFromFirebase, updateProfile } from '../services/authService';

export function useProfile() {
    const { token, userType, isLoading: authLoading } = useAuth();
    const currentUser = auth.currentUser;

    return useQuery<CustomerProfile | null, Error>({
        queryKey: ['profile', currentUser?.uid],
        queryFn: async () => {
            if (!currentUser?.uid || !userType) return null;
            return await getProfileFromFirebase(currentUser.uid, userType);
        },
        // Only run the query if we have a token, and auth has finished loading
        enabled: !!token && !authLoading && !!currentUser?.uid,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation<CustomerProfile, Error, Partial<CustomerProfile>>({
        mutationFn: async (data: Partial<CustomerProfile>) => {
            return await updateProfile(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
}

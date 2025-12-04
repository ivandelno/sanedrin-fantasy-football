import { supabase } from '../config/supabase';
import type { User } from '../types/database.types';

class AuthService {
    // Login using RPC that verifies password with pgcrypto
    async login(username: string, password: string): Promise<User> {
        const { data, error } = await supabase.rpc('login_user', {
            p_username: username,
            p_password: password
        });
        if (error || !data || (Array.isArray(data) && data.length === 0)) {
            throw new Error('Invalid username or password');
        }

        // RPC returning TABLE returns an array
        const user = Array.isArray(data) ? data[0] : data;
        return user as User;
    }

    // Change password after verifying current password via RPC
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        // Verify current password
        const { data: verified, error: verifyError } = await supabase.rpc('verify_user_password', {
            p_uid: userId,
            p_password: currentPassword,
        });
        if (verifyError || !verified) {
            throw new Error('Current password is incorrect');
        }
        // Update password using crypt RPC
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash: await supabase.rpc('crypt', { password: newPassword, salt: await supabase.rpc('gen_salt', 'bf') }),
            })
            .eq('id', userId);
        if (updateError) {
            throw new Error('Failed to update password');
        }
    }

    // Reset password (admin use) – directly update with crypt
    async resetPassword(userId: string, newPassword: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({
                password_hash: await supabase.rpc('crypt', { password: newPassword, salt: await supabase.rpc('gen_salt', 'bf') }),
            })
            .eq('id', userId);
        if (error) {
            throw new Error('Failed to reset password');
        }
    }
}

export const authService = new AuthService();

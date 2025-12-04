import { supabase } from '../config/supabase';
import { User } from '../types/database.types';

class AuthService {
    async login(username: string, password: string): Promise<User> {
        try {
            // Query user with password verification using pgcrypto
            const { data, error } = await supabase
                .from('users')
                .select('id, username, is_admin')
                .eq('username', username)
                .eq('password_hash', supabase.rpc('crypt', { password, salt: 'password_hash' }))
                .single();

            if (error || !data) {
                throw new Error('Invalid username or password');
            }

            return data as User;
        } catch (error) {
            console.error('Login error:', error);
            throw new Error('Invalid username or password');
        }
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
        try {
            // Verify current password first
            const { data: user, error: verifyError } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .eq('password_hash', supabase.rpc('crypt', { password: currentPassword, salt: 'password_hash' }))
                .single();

            if (verifyError || !user) {
                throw new Error('Current password is incorrect');
            }

            // Update password using pgcrypto
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    password_hash: supabase.rpc('crypt', { password: newPassword, salt: supabase.rpc('gen_salt', 'bf') })
                })
                .eq('id', userId);

            if (updateError) {
                throw new Error('Failed to update password');
            }
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    async resetPassword(userId: number, newPassword: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    password_hash: supabase.rpc('crypt', { password: newPassword, salt: supabase.rpc('gen_salt', 'bf') })
                })
                .eq('id', userId);

            if (error) {
                throw new Error('Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();

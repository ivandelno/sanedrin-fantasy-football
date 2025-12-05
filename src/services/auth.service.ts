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
        const { data, error } = await supabase.rpc('change_user_password', {
            p_user_id: userId,
            p_current_password: currentPassword,
            p_new_password: newPassword
        });

        if (error) {
            // Check if it's a password verification error
            if (error.message.includes('Current password is incorrect')) {
                throw new Error('La contraseña actual es incorrecta');
            }
            throw new Error('Error al cambiar la contraseña');
        }

        if (!data) {
            throw new Error('Error al cambiar la contraseña');
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

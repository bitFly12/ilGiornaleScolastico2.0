/**
 * Authentication Module
 * Handles user registration, login, and email verification
 */

import { getSupabaseClient } from './supabase-client.js';

/**
 * Validate email is from @cesaris.edu.it domain
 */
export function validateCesarisEmail(email) {
    const domain = '@cesaris.edu.it';
    return email.toLowerCase().endsWith(domain);
}

/**
 * Register new user with comprehensive error handling
 */
export async function registerUser(email, password, displayName) {
    const client = getSupabaseClient();
    if (!client) {
        return {
            success: false,
            error: 'Supabase client not initialized. Please check configuration.'
        };
    }

    // Validate email domain
    if (!validateCesarisEmail(email)) {
        return {
            success: false,
            error: 'Email must be from @cesaris.edu.it domain'
        };
    }

    // Validate password strength
    if (password.length < 8) {
        return {
            success: false,
            error: 'Password must be at least 8 characters long'
        };
    }

    try {
        // Sign up user with Supabase Auth
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    display_name: displayName,
                    email_domain: 'cesaris.edu.it'
                },
                emailRedirectTo: `${window.location.origin}/pages/confirm-email.html`
            }
        });

        if (error) {
            console.error('Supabase registration error:', error);
            
            // Handle specific error types
            if (error.message.includes('User already registered')) {
                return {
                    success: false,
                    error: 'An account with this email already exists. Please login instead.'
                };
            }
            
            if (error.message.includes('Database error')) {
                return {
                    success: false,
                    error: 'Database error during registration. This may be due to missing tables or triggers in Supabase. Please check the setup guide.',
                    technicalError: error.message
                };
            }

            if (error.message.includes('trigger')) {
                return {
                    success: false,
                    error: 'Database trigger error. Please ensure all required database triggers are set up correctly.',
                    technicalError: error.message
                };
            }

            return {
                success: false,
                error: error.message || 'Registration failed. Please try again.'
            };
        }

        if (data.user) {
            console.log('✅ User registered successfully:', data.user.email);
            
            // Check if email confirmation is required
            if (data.user.identities && data.user.identities.length === 0) {
                return {
                    success: true,
                    requiresConfirmation: true,
                    message: 'Please check your email to confirm your account.',
                    user: data.user
                };
            }

            return {
                success: true,
                requiresConfirmation: false,
                message: 'Registration successful!',
                user: data.user
            };
        }

        return {
            success: false,
            error: 'Registration failed for unknown reason. Please try again.'
        };

    } catch (error) {
        console.error('Exception during registration:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during registration.',
            technicalError: error.message
        };
    }
}

/**
 * Login existing user
 */
export async function loginUser(email, password) {
    const client = getSupabaseClient();
    if (!client) {
        return {
            success: false,
            error: 'Supabase client not initialized. Please check configuration.'
        };
    }

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Login error:', error);
            
            if (error.message.includes('Invalid login credentials')) {
                return {
                    success: false,
                    error: 'Invalid email or password. Please try again.'
                };
            }

            if (error.message.includes('Email not confirmed')) {
                return {
                    success: false,
                    error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.'
                };
            }

            return {
                success: false,
                error: error.message || 'Login failed. Please try again.'
            };
        }

        if (data.user) {
            console.log('✅ User logged in successfully:', data.user.email);
            return {
                success: true,
                user: data.user,
                session: data.session
            };
        }

        return {
            success: false,
            error: 'Login failed for unknown reason.'
        };

    } catch (error) {
        console.error('Exception during login:', error);
        return {
            success: false,
            error: 'An unexpected error occurred during login.',
            technicalError: error.message
        };
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
    const client = getSupabaseClient();
    if (!client) {
        return {
            success: false,
            error: 'Supabase client not initialized.'
        };
    }

    try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/pages/reset-password.html`
        });

        if (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            message: 'Password reset email sent. Please check your inbox.'
        };

    } catch (error) {
        console.error('Exception during password reset:', error);
        return {
            success: false,
            error: 'An unexpected error occurred.'
        };
    }
}

/**
 * Resend confirmation email
 */
export async function resendConfirmationEmail(email) {
    const client = getSupabaseClient();
    if (!client) {
        return {
            success: false,
            error: 'Supabase client not initialized.'
        };
    }

    try {
        const { error } = await client.auth.resend({
            type: 'signup',
            email: email
        });

        if (error) {
            console.error('Resend confirmation error:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            message: 'Confirmation email resent. Please check your inbox.'
        };

    } catch (error) {
        console.error('Exception during resend confirmation:', error);
        return {
            success: false,
            error: 'An unexpected error occurred.'
        };
    }
}

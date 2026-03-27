/**
 * useAuth — Authentication Context Hook
 *
 * Typed shortcut for consuming AuthContext.
 * Must be used inside <AuthProvider>.
 *
 * Returns:
 *   { user, loading, login, register, logout, updateUser }
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/app/context/AuthContext';

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

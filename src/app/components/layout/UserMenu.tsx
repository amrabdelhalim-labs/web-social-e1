'use client';

/**
 * UserMenu — Account Dropdown (Guest + Authenticated)
 *
 * Two states:
 * - Guest: PersonOutline icon → Menu: login, sign up
 * - Authenticated: Avatar icon → Menu: user info, profile, log out (Arabic labels in UI)
 */

import { useState } from 'react';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = Boolean(anchor);
  const isGuest = !user;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  const navigate = (href: string) => {
    handleClose();
    router.push(href);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    router.push('/');
  };

  return (
    <>
      <Tooltip title={isGuest ? 'حساب الضيف' : 'حسابي'}>
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-controls={open ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label={isGuest ? 'قائمة الضيف' : 'قائمة المستخدم'}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          {isGuest ? (
            <AccountCircleIcon sx={{ fontSize: 32 }} />
          ) : (
            <Avatar
              src={user.avatarUrl ?? undefined}
              alt={user.name}
              sx={{ width: 34, height: 34, fontSize: '0.9rem', fontWeight: 700 }}
            >
              {getInitial(user.name)}
            </Avatar>
          )}
        </IconButton>
      </Tooltip>

      <Menu
        id="user-menu"
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 200, mt: 0.5 } } }}
      >
        {isGuest
          ? [
              <MenuItem key="login" onClick={() => navigate('/login')}>
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                تسجيل الدخول
              </MenuItem>,
              <MenuItem key="register" onClick={() => navigate('/register')}>
                <ListItemIcon>
                  <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                إنشاء حساب
              </MenuItem>,
            ]
          : [
              <MenuItem key="info" disabled disableRipple>
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                </Box>
              </MenuItem>,
              <Divider key="d1" />,
              <MenuItem key="profile" onClick={() => navigate('/profile')}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                ملفي الشخصي
              </MenuItem>,
              <Divider key="d2" />,
              <MenuItem key="logout" onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                تسجيل الخروج
              </MenuItem>,
            ]}
      </Menu>
    </>
  );
}

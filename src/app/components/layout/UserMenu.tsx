'use client';

/**
 * UserMenu — Authenticated User Dropdown
 *
 * Shows the user's avatar in the AppBar. On click, opens a Menu with:
 *  - User name + email (informational, not clickable)
 *  - Navigation: "صوري" → /my-photos  |  "ملفي" → /profile
 *  - "تسجيل الخروج" → calls logout() then navigates to /
 *
 * Uses MUI Avatar with initials fallback when avatarUrl is null.
 */

import { useState, type MouseEvent } from 'react';
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
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';

/** Returns the first letter of a name (for avatar initials) */
function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const open = Boolean(anchor);

  const handleOpen = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
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
      <Tooltip title="حسابي">
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-controls={open ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-label="قائمة المستخدم"
        >
          <Avatar
            src={user.avatarUrl ?? undefined}
            alt={user.name}
            sx={{ width: 34, height: 34, fontSize: '0.9rem', fontWeight: 700 }}
          >
            {getInitial(user.name)}
          </Avatar>
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
        {/* User info (non-interactive) */}
        <MenuItem disabled disableRipple>
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => navigate('/my-photos')}>
          <ListItemIcon>
            <PhotoLibraryIcon fontSize="small" />
          </ListItemIcon>
          صوري
        </MenuItem>

        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          ملفي الشخصي
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          تسجيل الخروج
        </MenuItem>
      </Menu>
    </>
  );
}

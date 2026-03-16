'use client';

/**
 * SiteAppBar — Main Application Header
 *
 * - App name + icon (non-clickable)
 * - Nav: الرئيسية | صوري — desktop (md+); drawer on xs/sm
 * - Active link: underline + primary color
 * - ThemeToggle + UserMenu (fixed, never in drawer)
 */

import { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import HomeIcon from '@mui/icons-material/Home';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import MenuIcon from '@mui/icons-material/Menu';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/app/hooks/useAuth';
import { APP_NAME } from '@/app/config';

const navLinks = [
  { href: '/', label: 'الرئيسية', icon: HomeIcon },
  { href: '/my-photos', label: 'صوري', icon: PhotoLibraryIcon },
];

interface NavContentProps {
  isActive: (href: string) => boolean;
  onDrawerClose: () => void;
  inDrawer?: boolean;
}

function NavContent({ isActive, onDrawerClose, inDrawer = false }: NavContentProps) {
  return (
    <>
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return inDrawer ? (
          <ListItem key={href} disablePadding>
            <ListItemButton
              component={Link}
              href={href}
              onClick={onDrawerClose}
              selected={active}
              sx={{
                minHeight: 48,
                minWidth: 44,
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  borderRight: 3,
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon>
                <Icon color={active ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontWeight: active ? 700 : 500 }}
              />
            </ListItemButton>
          </ListItem>
        ) : (
          <Button
            key={href}
            component={Link}
            href={href}
            variant="text"
            size="small"
            color={active ? 'primary' : 'inherit'}
            startIcon={<Icon fontSize="small" />}
            sx={{
              minWidth: 64,
              minHeight: 44,
              px: 1.5,
              fontWeight: active ? 700 : 500,
              borderBottom: active ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 0,
              '&:hover': {
                bgcolor: 'action.hover',
                borderBottom: active ? 2 : 1,
                borderColor: active ? 'primary.main' : 'divider',
              },
            }}
          >
            {label}
          </Button>
        );
      })}
    </>
  );
}

export function SiteAppBar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar
          sx={{
            gap: 0.5,
            px: { xs: 1.5, sm: 2, md: 3 },
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* Drawer trigger — xs/sm only */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              display: { xs: 'flex', md: 'none' },
              mr: 0.5,
              minWidth: 44,
              minHeight: 44,
            }}
            aria-label="فتح القائمة"
          >
            <MenuIcon />
          </IconButton>

          {/* App name + icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mr: { xs: 1, sm: 2 } }}>
            <PhotoCameraIcon sx={{ color: 'primary.main', fontSize: { xs: 24, sm: 28 } }} />
            <Typography
              variant="h6"
              component="span"
              fontWeight={800}
              color="primary"
              sx={{ letterSpacing: '-0.02em' }}
            >
              {APP_NAME}
            </Typography>
          </Box>

          {/* Nav links — md+ only */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.25, flexGrow: 1 }}>
            <NavContent isActive={isActive} onDrawerClose={() => setDrawerOpen(false)} />
          </Box>

          {/* Theme + UserMenu (guest or auth) — always visible */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto' }}>
            <ThemeToggle />
            {!loading && <UserMenu />}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.5)' } } }}
      >
        <Box sx={{ width: 260, pt: 2 }} role="presentation">
          <List>
            <NavContent isActive={isActive} onDrawerClose={() => setDrawerOpen(false)} inDrawer />
          </List>
        </Box>
      </Drawer>
    </>
  );
}

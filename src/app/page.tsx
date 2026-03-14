import { Box, Typography, Container } from '@mui/material';
import { APP_NAME } from './config';

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h2" component="h1" fontWeight={700}>
          {APP_NAME}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          موقع مشاركة الصور — قيد التطوير
        </Typography>
      </Box>
    </Container>
  );
}

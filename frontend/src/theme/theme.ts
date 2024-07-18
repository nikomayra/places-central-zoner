import { createTheme } from '@mui/material/styles';
import '../colors.css';

const theme = createTheme({
  palette: {
    primary: {
      main: getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-main')
        .trim(),
    },
    secondary: {
      main: getComputedStyle(document.documentElement)
        .getPropertyValue('--secondary-main')
        .trim(),
    },
  },
});

export default theme;

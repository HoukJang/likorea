// Centralized MUI imports to prevent chunk loading issues
// This file pre-loads all MUI components used in the application

export {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  FormHelperText,
  Tabs,
  Tab
} from '@mui/material';

export {
  Add as AddIcon
} from '@mui/icons-material';

// Pre-load all MUI components to prevent lazy loading conflicts
import '@mui/material/styles';
import '@mui/material/CssBaseline';
import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  Paper,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress,
  AlertColor,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { googleProvider, githubProvider } from "../../firebase";
import { signInWithProvider } from "../../firebase/auth/signInWithProvider";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

// Type definitions
interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

const Login: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
  });

  // Check for existing authentication on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is already signed in, redirect silently
        router.push("/");
      } else {
        // No user, show login interface
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const showNotification = (
    message: string,
    severity: AlertColor = "info"
  ): void => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = (): void => {
    setNotification({ ...notification, open: false });
  };

  const handleProviderSignIn = async (
    provider: any,
    providerName: string
  ): Promise<void> => {
    setLoading(true);

    try {
      const result = await signInWithProvider(provider, providerName);

      if (result.success) {
        // Show appropriate success message
        if (result.linkedAutomatically) {
          showNotification(
            result.message || "Accounts linked and signed in successfully!",
            "success"
          );
        } else {
          showNotification(
            result.message || `Signed in successfully with ${providerName}!`,
            "success"
          );
        }

        // Redirect to the main application page if there are no conflicts
        if (!result.needsLinking) {
          router.push("/"); // Redirect directly to the main app page
        } else {
          // If there are conflicts, show a notification and handle accordingly
          showNotification(
            result.error ||
              `An account with this email already exists. Please sign in with ${result.existingMethods?.join(
                ", "
              )} first to link your accounts.`,
            "warning"
          );
        }
      } else {
        // Handle failure cases
        showNotification(result.error || "Sign in failed", "error");
      }
    } catch (error: any) {
      console.error("Unexpected error during sign-in:", error);
      showNotification(
        "An unexpected error occurred. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = (): Promise<void> => {
    return handleProviderSignIn(googleProvider, "Google");
  };

  const handleSignInWithGitHub = (): Promise<void> => {
    return handleProviderSignIn(githubProvider, "GitHub");
  };

  // Show loading screen during auth check
  if (checkingAuth) {
    return (
      <Root>
        <LoginCard elevation={3}>
          <Content>
            <CircularProgress size={40} />
            <Typography variant="body1" color="text.secondary" mt={2}>
              Checking authentication...
            </Typography>
          </Content>
        </LoginCard>
      </Root>
    );
  }

  return (
    <Root>
      <LoginCard elevation={3}>
        <Header>
          <Logo src="../../../Chatlink-Logo.png" alt="Application Logo" />
        </Header>

        <Content>
          <Typography variant="h4" component="h1" fontWeight={500} gutterBottom>
            Welcome Back
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={4}>
            Sign in to access your account
          </Typography>

          <StyledButton
            onClick={handleSignInWithGoogle}
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <GoogleIcon />
            }
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </StyledButton>

          <StyledButton
            onClick={handleSignInWithGitHub}
            variant="contained"
            fullWidth
            size="large"
            sx={{ marginTop: 2 }}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <GitHubIcon />
            }
          >
            {loading ? "Signing in..." : "Continue with GitHub"}
          </StyledButton>

          {loading && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Authenticating and linking accounts if needed...
              </Typography>
            </Box>
          )}
        </Content>
      </LoginCard>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Root>
  );
};

// Styled components
const Root = styled(Box)<{}>(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: theme.spacing(2),
}));

const LoginCard = styled(Paper)<{}>(({ theme }) => ({
  width: "400px",
  overflow: "hidden",
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  backgroundColor: theme.palette.background.paper,
}));

const Header = styled(Box)<{}>(({ theme }) => ({
  height: 200,
  width: "100%",
  position: "relative",
  overflow: "hidden",
  backgroundColor: theme.palette.primary.main,
}));

const Logo = styled("img")<{}>({
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
});

const Content = styled(Box)<{}>(({ theme }) => ({
  padding: theme.spacing(4, 6),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
}));

const StyledButton = styled(Button)<{}>(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(3),
  fontWeight: 500,
  textTransform: "none",
  fontSize: "1rem",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
}));

export default Login;

// src/components/Login.tsx
"use client";

import { Button, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { auth, provider } from "../../firebase"; // Import Firebase auth and provider
import { signInWithPopup, signOut } from "firebase/auth"; // Import Firebase authentication methods
import { useRouter } from "next/navigation"; // Import useRouter for navigation

/**
 * Login component for user authentication.
 * Allows users to sign in with Google.
 */
const Login = () => {
  const router = useRouter(); // Use Next.js router for navigation

  // Function to sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      await signOut(auth); // Sign out the current user before signing in with a different account
      await signInWithPopup(auth, provider); // Sign in with Google
      router.push("/"); // Redirect to home after successful login
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  return (
    <Container>
      {/* Logo placeholder */}
      <Logo src="../../../225464805.png" alt="WhatsApp Logo" />
      <Title>Welcome Back!</Title>
      <Subtitle>Please sign in to continue</Subtitle>
      <Button
        onClick={handleSignInWithGoogle}
        variant="contained"
        color="primary"
        fullWidth
      >
        Sign in with Google
      </Button>
    </Container>
  );
};

// Styled components for consistent theming
const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(5), // Use theme spacing
  background: theme.palette.background.paper, // Use theme color
  borderRadius: 12,
  boxShadow: theme.shadows[2], // Use theme shadows
  width: "100%",
  maxWidth: 400,
  margin: "auto",
}));

const Logo = styled("img")(({ theme }) => ({
  width: "200px",
  height: "auto",
  marginBottom: "20px",
  borderRadius: theme.shape.borderRadius, // Accessing borderRadius from the theme
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: "24px",
  fontWeight: 600,
  marginBottom: theme.spacing(1), // Use theme spacing for margin
  color: theme.palette.text.primary, // Use theme color for text
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  color: theme.palette.text.secondary, // Use theme color for subtitle
  marginBottom: theme.spacing(2), // Use theme spacing for margin
}));

export default Login;

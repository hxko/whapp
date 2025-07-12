// src/components/Login.tsx
"use client";
import { Button, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { auth, provider } from "../../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { useRouter } from "next/navigation"; // Import useRouter for navigation

const Login = () => {
  const router = useRouter(); // Use Next.js router for navigation
  // Function to sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      await signOut(auth); // Sign out the current user before signing in with a different account
      const result = await signInWithPopup(auth, provider); // Sign in with Google
      router.push("/"); // Redirect to home after successful login
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  return (
    <Container>
      {/* //TODO: get your own Logo */}
      <Logo
        src="https://www.freeiconspng.com/uploads/logo-whatsapp-png-pic-0.png"
        alt="WhatsApp Logo"
      />
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

const Logo = styled("img")`
  width: 150px;
  height: auto;
  margin-bottom: 20px;
`;

const Title = styled(Typography)`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Subtitle = styled(Typography)`
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
`;

export default Login;

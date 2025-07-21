"use client";

import { Button, Typography, Box, Paper, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { auth, provider } from "../../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const Login = () => {
  const router = useRouter();
  const theme = useTheme();

  const handleSignInWithGoogle = async () => {
    try {
      await signOut(auth);
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  return (
    <Root>
      <LoginCard elevation={3}>
        <Header>
          <Logo src="../../../225464805.png" alt="Application Logo" />
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
          >
            Continue with Google
          </StyledButton>
        </Content>
      </LoginCard>
    </Root>
  );
};

// Styled components
const Root = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: 2,
});

const LoginCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 440,
  overflow: "hidden",
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  backgroundColor: theme.palette.background.paper,
}));

const Header = styled(Box)(({ theme }) => ({
  height: 200, // Fixed height for header
  width: "100%",
  position: "relative", // Makes this a positioning context
  overflow: "hidden", // Ensures the logo doesn't overflow
  backgroundColor: theme.palette.primary.main,
}));

const Logo = styled("img")({
  width: "100%",
  height: "100%",
  objectFit: "cover", // Cover will fill the container while maintaining aspect ratio
  display: "block", // Removes any default image margin/padding
});

const Content = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 6), // Increased vertical padding for more negative space
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(3), // Increased margin for more space above the button
  fontWeight: 500,
  textTransform: "none",
  fontSize: "1rem",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export default Login;

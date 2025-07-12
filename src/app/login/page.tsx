"use client";
import Login from "@components/Login";
import { styled } from "@mui/material/styles";

export default function LoginPage() {
  return (
    <LoginContainer>
      <Login />
    </LoginContainer>
  );
}

const LoginContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: theme.palette.background.default, // Use default background color from MUI palette
}));

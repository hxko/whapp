// app/dashboard/page.tsx
"use client"; // Important: Add this if your UserDashboard component uses hooks or is a client component

import React from "react";
import UserDashboard from "../../components/UserDashboard"; // Adjust the path if needed
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../firebase"; // Adjust the path if needed
import { useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material"; // For loading/skeleton if needed
import Loading from "@/components/Loading";

const DashboardPage = () => {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  // Optional: Handle loading state while checking auth
  if (loading) {
    return <Loading />;
  }

  // Optional: Handle error state
  if (error) {
    console.error("Auth error in dashboard:", error);
    // You might want to show an error message or redirect
  }

  // Redirect to login if user is not authenticated
  // This check might also be handled by middleware, but it's good practice here too.
  if (!user) {
    // Use useEffect to avoid redirecting during SSR/hydration issues in some cases,
    // but a direct redirect is often fine in Next.js App Router page components.
    // router.push('/login'); // Or wherever your login page is
    // For server-side redirect, you'd use different techniques, but client-side is common here.
    // Let's assume UserDashboard handles the 'not signed in' state itself as seen in its code.
    // If it doesn't fully handle it or you want a redirect, uncomment the lines below:
    /*
    React.useEffect(() => {
        router.push('/login'); // Adjust '/login' to your actual login route
    }, [router]);

    return null; // Or a loading indicator while redirecting
    */
    // However, since UserDashboard already shows an Alert if !user, we can just render it.
    // It will show the "Please sign in" message.
  }

  // Render the UserDashboard component
  return (
    <div>
      {" "}
      {/* Or a layout wrapper if needed */}
      <UserDashboard />
    </div>
  );
};

export default DashboardPage;

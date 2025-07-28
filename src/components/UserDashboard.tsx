"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Grid,
  Theme,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Link as LinkIcon,
  LinkOff as UnlinkIcon,
  AccountCircle,
  Security,
  Logout,
} from "@mui/icons-material";
import { signOut, AuthProvider } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useAccountLinking } from "@hooks/useAccountLinking";
import { useLinkedProviders } from "@hooks/useLinkedProvider";
import type { AlertColor } from "@mui/material";
import { useRouter } from "next/navigation";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteUserAccount } from "@utils/deleteUserAccount";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UserAvatar from "@components/UserAvatar";

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ProviderOption {
  id: string;
  name: string;
  provider: AuthProvider;
}

const DashboardContainer = styled(Box)(({ theme }) => ({
  maxWidth: 1200,
  margin: "0 auto",
  padding: theme.spacing(3),
}));

const StickyProfileCard = styled(Card)(({ theme }) => ({
  height: "fit-content",
  position: "sticky",
  top: theme.spacing(3),
  textAlign: "center",
}));

const InfoPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const ProviderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
}));

const LeftProviderInfo = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

const UserDashboard: React.FC = () => {
  const theme = useTheme();

  const router = useRouter();
  const [user] = useAuthState(auth);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: "",
    severity: "info",
  });

  // State für Dialog & Optionen
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDeep, setDeleteDeep] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const { linkedProviders, isProviderLinked, count, reloadProviders } =
    useLinkedProviders(user || null);
  const { loading, linkProvider, unlinkProvider, getProviderName } =
    useAccountLinking();

  const showNotification = (message: string, severity: AlertColor = "info") => {
    setNotification({ open: true, message, severity });
  };
  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case "google.com":
        return GoogleIcon;
      case "github.com":
        return GitHubIcon;
      default:
        return AccountCircle;
    }
  };

  // Funktion zum Auslösen des Dialogs
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
    }
  };

  const getProviderColor = (providerId: string, theme: Theme): string => {
    switch (providerId) {
      case "google.com":
        return "#4285f4";
      case "github.com":
        return theme.palette.mode === "dark" ? "#fff" : "#333";
      default:
        return "#666";
    }
  };

  const availableProviders: ProviderOption[] = [
    { id: "google.com", name: "Google", provider: googleProvider },
    { id: "github.com", name: "GitHub", provider: githubProvider },
  ];

  const handleLinkAccount = async (
    provider: AuthProvider,
    providerName: string
  ) => {
    if (!user) return;
    const result = await linkProvider(user, provider, providerName);
    showNotification(
      result.success
        ? result.message || `${providerName} linked successfully!`
        : result.error || `Failed to link ${providerName} account`,
      result.success ? "success" : "error"
    );
    if (result.success) await reloadProviders();
  };

  const handleUnlinkAccount: (providerId: string) => Promise<void> = async (
    providerId
  ) => {
    if (!user) return;
    const providerName = getProviderName(providerId);
    const result = await unlinkProvider(
      user,
      providerId,
      providerName,
      linkedProviders
    );
    showNotification(
      result.success
        ? result.message || `${providerName} unlinked successfully!`
        : result.error || `Failed to unlink ${providerName} account`,
      result.success ? "success" : "error"
    );
    if (result.success) await reloadProviders();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showNotification("Signed out successfully", "success");
    } catch (error) {
      console.error("Error signing out:", error);
      showNotification("Error signing out", "error");
    }
  };

  const confirmDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);

    const providerId = user.providerData[0]?.providerId || "google.com";

    const result = await deleteUserAccount(user, providerId, deleteDeep);

    setDeleting(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      showNotification("Account deleted successfully", "success");
      router.push("/");
    } else {
      showNotification(`Failed to delete account: ${result.error}`, "error");
    }
  };

  const handleNavigateToHome = () => {
    router.push("/");
  };

  if (!user) {
    return (
      <DashboardContainer>
        <Alert severity="info">Please sign in to view your dashboard.</Alert>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <StickyProfileCard>
            <CardContent>
              <BackButton onClick={handleNavigateToHome} title="Go to Chat App">
                <ArrowBackIcon />
              </BackButton>
              <Box display="flex" justifyContent="center" my={2}>
                <UserAvatar user={user} sx={{ width: 112, height: 112 }} />
              </Box>
              <Typography variant="h5" gutterBottom>
                {user.displayName || "User"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Chip
                icon={<Security />}
                label={`${count} account${count !== 1 ? "s" : ""} linked`}
                variant="outlined"
                size="small"
              />
              <Button
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={handleSignOut}
                fullWidth
                sx={{ mt: 2 }}
              >
                Sign Out
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={openDeleteDialog}
                fullWidth
                startIcon={<DeleteIcon />}
                sx={{ mt: 2 }}
              >
                Delete Account
              </Button>
            </CardContent>
          </StickyProfileCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Account Security
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your linked sign-in methods. You can use any of these
                methods to access your account.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Linked Sign-in Methods
              </Typography>
              <List>
                {availableProviders.map((providerOption) => {
                  const isLinked = isProviderLinked(providerOption.id);
                  const IconComponent = getProviderIcon(providerOption.id);
                  const providerData = linkedProviders.find(
                    (p) => p.providerId === providerOption.id
                  );

                  return (
                    <ListItem key={providerOption.id} divider disableGutters>
                      <ProviderRow>
                        <LeftProviderInfo>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <IconComponent
                              sx={{
                                color: getProviderColor(
                                  providerOption.id,
                                  theme
                                ),
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1">
                                  {providerOption.name}
                                </Typography>
                                {isLinked && (
                                  <Chip
                                    label="Connected"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              isLinked
                                ? `Connected as ${
                                    providerData?.displayName ||
                                    providerData?.email ||
                                    "User"
                                  }`
                                : "Not connected"
                            }
                          />
                        </LeftProviderInfo>
                        <Box>
                          {isLinked ? (
                            <IconButton
                              edge="end"
                              onClick={() =>
                                handleUnlinkAccount(providerOption.id)
                              }
                              disabled={loading || count <= 1}
                              title={
                                count <= 1
                                  ? "Cannot unlink the only sign-in method"
                                  : `Unlink ${providerOption.name}`
                              }
                              color="error"
                            >
                              {loading ? (
                                <CircularProgress size={20} />
                              ) : (
                                <UnlinkIcon />
                              )}
                            </IconButton>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                loading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <LinkIcon />
                                )
                              }
                              onClick={() =>
                                handleLinkAccount(
                                  providerOption.provider,
                                  providerOption.name
                                )
                              }
                              disabled={loading}
                            >
                              {loading ? "Linking..." : "Link"}
                            </Button>
                          )}
                        </Box>
                      </ProviderRow>
                    </ListItem>
                  );
                })}
              </List>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Security Note:</strong> You must have at least one
                  sign-in method linked to your account. Having multiple methods
                  makes it easier to access your account if you lose access to
                  one method.
                </Typography>
              </Alert>

              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Benefits of linking multiple accounts:</strong>
                </Typography>
                <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                  <Box component="li">Sign in with any linked method</Box>
                  <Box component="li">
                    Access your account even if one provider is unavailable
                  </Box>
                  <Box component="li">
                    Sync your profile information across providers
                  </Box>
                  <Box component="li">
                    Enhanced security with multiple authentication options
                  </Box>
                </Box>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoPaper>
                    <Typography variant="subtitle2" color="text.secondary">
                      User ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", wordBreak: "break-all" }}
                    >
                      {user.uid}
                    </Typography>
                  </InfoPaper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoPaper>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account Created
                    </Typography>
                    <Typography variant="body2">
                      {user.metadata.creationTime
                        ? new Date(
                            user.metadata.creationTime
                          ).toLocaleDateString()
                        : "Unknown"}
                    </Typography>
                  </InfoPaper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoPaper>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Sign In
                    </Typography>
                    <Typography variant="body2">
                      {user.metadata.lastSignInTime
                        ? new Date(
                            user.metadata.lastSignInTime
                          ).toLocaleDateString()
                        : "Unknown"}
                    </Typography>
                  </InfoPaper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoPaper>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email Verified
                    </Typography>
                    <Typography variant="body2">
                      {user.emailVerified ? "Yes" : "No"}
                    </Typography>
                  </InfoPaper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Are you sure you want to permanently delete your account? This
            action cannot be undone.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteDeep}
                onChange={(e) => setDeleteDeep(e.target.checked)}
                disabled={deleting}
              />
            }
            label="Also delete all your chats and messages"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteAccount}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};

export default UserDashboard;

const BackButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  display: "flex",
}));

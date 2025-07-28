"use client";
import { styled } from "@mui/material/styles";
import { Avatar, Button, IconButton } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchBar from "@components/SearchBar";
import { useState } from "react";
import ChatList from "@components/ChatList";
import useChats from "@hooks/useChats";
import { useAuth } from "@/components/AuthProvider";
import Footer from "@components/Footer";
import {
  fetchUserData,
  validateEmail,
  createChatInDB,
  chatExists,
  getChatPartner,
} from "@utils/utils";
import { Chat } from "types/types";
import { useRouter } from "next/navigation";
import { Menu, MenuItem, ListItemIcon } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutIcon from "@mui/icons-material/Logout";

const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const chats = useChats(user?.email || "");
  const router = useRouter();

  // Function to prompt for email input
  const promptForEmail = (): string | null => {
    return prompt(
      "Please enter an email address for the user you wish to chat with"
    );
  };

  // Function to create a new chat
  const createChat = async (): Promise<void> => {
    const email = promptForEmail();
    if (!email || !user) return alert("User  is not authenticated.");

    // Validate email and check if user exists
    if (!validateEmail(email) || email === user.email) {
      return alert("Please enter a valid email address.");
    }

    const userExists = await fetchUserData(email);
    if (!userExists) return alert(`User  with email ${email} does not exist.`);
    if (chatExists(chats, email, user.email || "")) {
      return alert(`A chat with ${email} already exists.`);
    }

    // Create a new chat and navigate to it
    const chatId = await createChatInDB(email, user);
    router.push(`/chat/${chatId}`);
  };

  // Function to handle user sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Function to handle chat actions
  const handleChatActions = () => {
    // Add your chat actions logic here
  };

  // Function to handle more options
  const handleMoreOptions = () => {
    // Add your more options logic here
  };

  // Filter chats based on search input
  const filteredChats = chats.filter((chat: Chat) => {
    const chatPartner = getChatPartner(chat, user?.email || "");
    return chatPartner?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleGoToDashboard = () => {
    handleCloseMenu();
    router.push("/dashboard");
  };

  const handleSignOutAndClose = async () => {
    handleCloseMenu();
    await handleSignOut();
  };

  // TODO: Use UserAvatar component
  // Construct the proxy URL for the user avatar
  const avatarUrl = user?.photoURL;
  const proxyUrl = avatarUrl
    ? `/api/avatarProxy?url=${encodeURIComponent(avatarUrl)}`
    : "";

  return (
    <Container>
      <Header>
        <UserAvatar
          title={user?.email || "User avatar"}
          src={proxyUrl}
          alt={user?.email ? `${user.email} avatar` : "User avatar"}
          role="button"
          aria-controls={menuOpen ? "user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
          onClick={handleAvatarClick}
          tabIndex={0}
        />
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleCloseMenu}
          onClick={handleCloseMenu}
          PaperProps={{
            elevation: 2,
            sx: {
              mt: 1.5,
              minWidth: 180,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleGoToDashboard}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            Dashboard
          </MenuItem>
          <MenuItem onClick={handleSignOutAndClose}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>

        <IconsContainer>
          <IconButton
            onClick={handleChatActions}
            aria-label="Chat actions"
            title="Chat actions"
          >
            <ChatIcon />
          </IconButton>
          <IconButton
            onClick={handleMoreOptions}
            aria-label="More options"
            title="More options"
          >
            <MoreVertIcon />
          </IconButton>
        </IconsContainer>
      </Header>
      <SearchBar input={searchQuery} onSearch={setSearchQuery} />
      <SidebarButton
        onClick={createChat}
        variant="contained"
        aria-label="Start a new chat"
        title="Start a new chat"
      >
        Start a new chat
      </SidebarButton>
      <ChatListContainer>
        <ChatList chats={filteredChats} />
      </ChatListContainer>
      <Footer />
    </Container>
  );
};

export default Sidebar;

// Styled components
const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
  height: "100vh",
}));

const Header = styled("div")(({ theme }) => ({
  position: "sticky",
  top: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  zIndex: 1,
  padding: "15px",
  height: "64px",
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const UserAvatar = styled(Avatar)(() => ({
  cursor: "pointer",
  ":hover": {
    opacity: 0.8,
  },
  // Add focus styles for better accessibility
  "&:focus": {
    outline: "2px solid",
    outlineOffset: "2px",
  },
}));

const IconsContainer = styled("div")``;

const SidebarButton = styled(Button)(({ theme }) => ({
  width: "90%",
  margin: `${theme.spacing(1)} auto`,
  padding: "10px 20px",
  borderRadius: "8px",
}));

const ChatListContainer = styled("div")(() => ({
  flexGrow: 1,
  overflowY: "auto",
}));

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
      console.log("User  signed out successfully.");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Filter chats based on search input
  const filteredChats = chats.filter((chat: Chat) => {
    const chatPartner = getChatPartner(chat, user?.email || "");
    return chatPartner?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Construct the proxy URL for the user avatar
  const avatarUrl = user?.photoURL;
  const proxyUrl = avatarUrl
    ? `/api/avatarProxy?url=${encodeURIComponent(avatarUrl)}`
    : "";

  return (
    <Container>
      <Header>
        <UserAvatar
          title={user?.email || ""}
          onClick={handleSignOut}
          src={proxyUrl} // Use the proxy URL for the avatar
          alt={user?.email || ""}
        />
        <IconsContainer>
          <IconButton>
            <ChatIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </IconsContainer>
      </Header>
      <SearchBar input={searchQuery} onSearch={setSearchQuery} />
      <SidebarButton onClick={createChat} variant="contained">
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

const UserAvatar = styled(Avatar)(({ theme }) => ({
  cursor: "pointer",
  ":hover": {
    opacity: 0.8,
  },
}));

const IconsContainer = styled("div")``;

const SidebarButton = styled(Button)(({ theme }) => ({
  width: "90%",
  margin: "0 auto",
  padding: "10px 20px",
  borderRadius: "8px",
}));

const ChatListContainer = styled("div")(({ theme }) => ({
  flexGrow: 1,
  overflowY: "auto",
}));

// Sidebar.tsx
"use client";
import { styled } from "@mui/material/styles";
import { Avatar, Button, IconButton } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchBar from "@components/SearchBar"; // Import the SearchBar component
import { useState } from "react"; // Import useState
import ChatList from "@components/ChatList"; // Import the ChatList component
import { signOut } from "firebase/auth"; // Import signOut function
import useChats from "@hooks/useChats"; // Import custom hook
import { useAuth } from "@/components/AuthProvider";

import {
  fetchUserData,
  validateEmail,
  createChatInDB,
  chatExists,
  getChatPartner,
} from "@utils/utils"; // Import utility functions
import { Chat } from "types/types"; // Import the Chat interface
import { useRouter } from "next/navigation"; // Import useRouter for navigation

const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>(""); // State to store the search input
  const chats = useChats(user?.email || ""); // Use custom hook to get chats
  const router = useRouter(); // Use Next.js router for navigation

  // Prompt for email
  const promptForEmail = (): string | null => {
    return prompt(
      "Please enter an email address for the user you wish to chat with"
    );
  };

  // Function to create a new chat
  const createChat = async (): Promise<void> => {
    const email = promptForEmail();
    if (!email) return; // Exit if no email is provided

    // Ensure user is defined
    if (!user) {
      alert("User  is not authenticated.");
      return;
    }

    // Check if the email is valid and not the current user's email
    if (!validateEmail(email) || email === user.email) {
      alert("Please enter a valid email address.");
      return;
    }

    // Check if the user exists in the database
    const userExists = await fetchUserData(email);
    if (!userExists) {
      alert(`User  with email ${email} does not exist.`);
      return; // Exit if the user does not exist
    }

    // Check if a chat already exists with the specified email
    if (chatExists(chats, email, user.email || "")) {
      alert(`A chat with ${email} already exists.`);
      return;
    }

    // Create a new chat in the database
    await createChatInDB(email, user); // Pass the user object
    console.log("Creating chat for email: ", email);
  };

  // Function to sign out the current user
  const handleSignOut = async () => {
    try {
      await signOut(); // Sign out the current user
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

  return (
    <Container>
      <Header>
        <UserAvatar
          title={user?.email || ""}
          onClick={handleSignOut}
          src={user?.photoURL || ""}
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
      <SidebarButton onClick={createChat}>Start a new chat</SidebarButton>
      <ChatList chats={filteredChats} />
    </Container>
  );
};

export default Sidebar;

// Styled components
const Container = styled("div")``;

const Header = styled("div")`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1;
  padding: 15px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
`;

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const IconsContainer = styled("div")``;

const SidebarButton = styled(Button)`
  width: 100%;
  &&& {
    border-top: 1px solid whitesmoke;
    border-bottom: 1px solid whitesmoke;
  }
`;

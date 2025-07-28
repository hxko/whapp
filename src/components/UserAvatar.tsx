import { Avatar } from "@mui/material";
import type { User } from "firebase/auth";
import type { SxProps, Theme } from "@mui/material/styles";

type UserAvatarProps = {
  user: User;
  sx?: SxProps<Theme>; // erlaubt Theme-abhängige Styles
};

function UserAvatar({ user, sx }: UserAvatarProps) {
  const photoURL = user.photoURL
    ? `/api/avatarProxy?url=${encodeURIComponent(user.photoURL)}`
    : undefined;

  return (
    <Avatar
      sx={{ width: 48, height: 48, ...sx }}
      title={user.displayName || user.email || "User"}
      src={photoURL}
      alt={user.displayName || user.email || "User"}
      onError={(e) => {
        // Fallback on broken image
        const target = e.currentTarget as HTMLImageElement;
        target.onerror = null;
        target.src = ""; // remove image fallback to initials
      }}
    >
      {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
    </Avatar>
  );
}

export default UserAvatar;

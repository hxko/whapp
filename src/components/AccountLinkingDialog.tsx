import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface LinkingDialogProps {
  open: boolean;
  email: string;
  existingMethods: string[];
  onClose: () => void;
  onLink: () => void;
}

const LinkingDialog: React.FC<LinkingDialogProps> = ({
  open,
  email,
  existingMethods,
  onClose,
  onLink,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Link Accounts</DialogTitle>
      <DialogContent>
        <Typography>
          An account with the email <strong>{email}</strong> already exists.
          Please choose a sign-in method to link your accounts:
        </Typography>
        <Typography>Existing methods: {existingMethods.join(", ")}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onLink} color="primary">
          Link Accounts
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkingDialog;

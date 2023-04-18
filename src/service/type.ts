export type User = {
  _id: string;
  displayName: string;
  email: string;
  photoURL: string;
};
export type Reaction = {
  user: User;
  name: string;
};
export type UserInRoom = {
  user: User | null;
  nickname: string;
};
export type Message = {
  _id: string;
  roomId: string;
  text: string;
  type: "Notification" | "Sending" | "Revocation";
  files: string[];
  reply: Message|null;
  reaction: Reaction[];
  actedByUser: User | null;
  createdAt: Date;
};
export type Room = {
  _id: string;
  type: "Group" | "Private";
  isAcceptLink?: boolean;
  name: string;
  initiator: string;
  photoURL: string;
  users: UserInRoom[];
  lastMessage: Message;
};
export type Media = {
  files: string[];
};

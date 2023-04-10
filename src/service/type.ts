export interface User {
  _id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}
export interface Reaction {
  user: User;
  name: string;
}
export interface UserInRoom {
  user: User | null;
  nickname?: string | null;
}
export interface Message {
  _id: string;
  roomId?: string;
  text?: string;
  type?: "Notification" | "Sending" | "Revocation";
  files?: string[];
  reply?: Message;
  reaction?: Reaction[] | string[];
  actedByUser: User | string | null;
  createdAt?: Date;
}
export interface Room {
  _id: string;
  type?: "Group" | "Private";
  isAcceptLink?: boolean;
  name?: string;
  initiator: string;
  photoURL?: string;
  users: UserInRoom[];
  lastMessage: Message;
}
export interface Media {
  files: string[];
}

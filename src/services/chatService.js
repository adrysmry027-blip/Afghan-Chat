import {
  get,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
} from "firebase/database";
import { requireFirebase } from "../firebase";

export function subscribeToChat(chatId, onMessages, onError) {
  const { database } = requireFirebase();
  const messagesRef = ref(database, `messages/${chatId}`);
  return onValue(
    messagesRef,
    (snapshot) => {
      const value = snapshot.val() || {};
      const messages = Object.entries(value)
        .map(([id, message]) => ({ id, ...message }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      onMessages(messages);
    },
    onError,
  );
}

export async function sendChatMessage(chatId, user, text) {
  const { database } = requireFirebase();
  const cleanText = text.trim();
  if (!cleanText) return null;
  const messagesRef = ref(database, `messages/${chatId}`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, {
    text: cleanText,
    senderId: user.uid,
    senderName: user.displayName || "",
    createdAt: serverTimestamp(),
    type: "text",
  });
  return newMessageRef.key;
}

export async function deleteOwnChatMessage(chatId, messageId, user) {
  const { database } = requireFirebase();
  const messageRef = ref(database, `messages/${chatId}/${messageId}`);
  const snapshot = await get(messageRef);
  if (!snapshot.exists() || snapshot.val()?.senderId !== user?.uid) {
    throw new Error("فقط فرستنده می‌تواند پیام خودش را حذف کند.");
  }
  await remove(messageRef);
}

"use client";
import { AppText } from "@/components/Text";

import { OrderChat } from "@repo/api/components/order-chat";
import { AppFrame } from "@/components/AppFrame";
import { useApp } from "@/context/AppContext";
export default function ChatPage() {
  const { accessToken, activeOrderId } = useApp();
  return (
    <AppFrame>
      {accessToken && activeOrderId ? (
        <OrderChat orderId={activeOrderId} accessToken={accessToken} />
      ) : (
        <AppText as="p">Open an active order to chat with your courier.</AppText>
      )}
    </AppFrame>
  );
}

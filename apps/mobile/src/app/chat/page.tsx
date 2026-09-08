"use client";
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
        <p>Open an active order to chat with your courier.</p>
      )}
    </AppFrame>
  );
}

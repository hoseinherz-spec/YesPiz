"use client";
import { EmptyState } from "@/components/EmptyState";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MessageCircle } from "@/components/animated-icon/icons";
import { pizzaCraftAsset } from "@/constants/media";
import { OrderChat } from "@repo/api/components/order-chat";
import { AppFrame } from "@/components/AppFrame";
import { useApp } from "@/context/AppContext";
export default function ChatPage() {
  const { accessToken, activeOrderId, language } = useApp();
  const de = language === "de";
  return (
    <AppFrame className="reference-screen chat-screen">
      <ScreenHeader
        title={de ? "Dein Kurier" : "Your courier"}
        backHref="/orders/"
      />
      {accessToken && activeOrderId ? (
        <OrderChat orderId={activeOrderId} accessToken={accessToken} />
      ) : (
        <EmptyState
          icon={<MessageCircle size={28} />}
          image={pizzaCraftAsset("Scooter")}
          title={de ? "Wir bleiben in Kontakt" : "Stay in the loop"}
          body={
            de
              ? "Öffne eine aktive Bestellung, um mit deinem Kurier zu chatten."
              : "Open an active order to chat with your courier about your delivery."
          }
          actionLabel={de ? "Bestellungen ansehen" : "View orders"}
          actionHref="/orders/"
        />
      )}
    </AppFrame>
  );
}

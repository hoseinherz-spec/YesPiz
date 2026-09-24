"use client";
import { Button, Drawer } from "@heroui/react";
import { X } from "@/components/animated-icon/icons";
import type { ReactNode } from "react";
export function ReferenceSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Drawer
      isOpen={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Drawer.Backdrop className="bg-black/45">
        <Drawer.Content
          placement="bottom"
          className="mx-auto w-full max-w-[473px]"
        >
          <Drawer.Dialog className="reference-sheet outline-none">
            <Drawer.Header className="mb-5 flex items-center justify-between gap-3">
              <Drawer.Heading>{title}</Drawer.Heading>
              <Button
                isIconOnly
                variant="secondary"
                aria-label="Close"
                onPress={onClose}
                className="size-10 min-w-10 rounded-full"
              >
                <X size={18} />
              </Button>
            </Drawer.Header>
            <Drawer.Body className="p-0">{children}</Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

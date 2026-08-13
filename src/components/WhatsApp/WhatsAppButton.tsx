"use client";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phone = "8801622541719";
  const message = "Hello CrossCart! I need help with my shipment.";
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-[60] flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform"
      data-testid="whatsapp-button"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
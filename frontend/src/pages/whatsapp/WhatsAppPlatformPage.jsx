import React from 'react';
import SingleWhatsAppChatView from '../../components/whatsapp/SingleWhatsAppChatView';

export default function WhatsAppPlatformPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#EFEAE2]">
      {/* Single Full-Screen Centered WhatsApp Chat Experience */}
      <SingleWhatsAppChatView />
    </div>
  );
}

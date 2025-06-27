'use client'

// src/components/CoroverChatbot.tsx

import { useEffect } from "react";

export default function CoroverChatbot() {
  useEffect(() => {
    // Prevent duplicate script injection
    if (document.getElementById("corover-chatbot-script")) return;

    const s = document.createElement("script");
    s.src = "https://builder.corover.ai/params/widget/corovercb.lib.min.js?appId=43e9c5a1-9aa1-4e7f-ac22-f284f55a9062";
    s.type = "text/javascript";
    s.id = "corover-chatbot-script";
    document.body.appendChild(s);

    // Optional: Cleanup on unmount
    return () => {
      s.remove();
    };
  }, []);

  return null; // This component does not render anything visible
}
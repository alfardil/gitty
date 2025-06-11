"use client";

import Header from "@/components/Header";
import { Card } from "@/components/ui/neo/card";
import { Button } from "@/components/ui/neo/button";
import { Input } from "@/components/ui/neo/input";
import { useState } from "react";
import { Plus, Send } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/neo/sidebar";

const mockConversations = [
  {
    id: 1,
    title: "Improvement Suggestions ...",
    lastMessage: "I have successfully created a we...",
    time: "14:26",
  },
];

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      from: "manus",
      text: "Manus is attempting to deploy the service located at `/home/ubuntu/feedback_website` to the public network. Please confirm if you agree by clicking the button.",
    },
    { from: "user", text: "Accepted" },
    {
      from: "manus",
      text: "I have successfully created a website based on the feedback document and deployed it permanently. You can access the website at the following URL: https://gcmnwvcsx.manus.space",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { from: "user", text: input }]);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SidebarProvider>
        <div className="flex flex-1 min-h-0 w-full pt-20">
          <Sidebar className="pt-20">
            <Button className="w-full flex gap-2" variant="neutral">
              <Plus className="w-5 h-5" /> New Chat
            </Button>

            <SidebarMenu className="flex-1 overflow-y-auto px-2 pt-4">
              {mockConversations.map((conv) => (
                <SidebarMenuItem key={conv.id} className="mb-2">
                  <Card className="p-3 border-2 border-black cursor-pointer hover:bg-blue-100 transition-colors">
                    <div className="font-semibold text-base truncate">
                      {conv.title}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {conv.lastMessage}
                    </div>
                    <div className="text-xs text-right text-gray-400 mt-1">
                      {conv.time}
                    </div>
                  </Card>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarFooter className="p-4 pt-2 text-xs text-gray-500 text-center">
              Alfardil Alam
            </SidebarFooter>
          </Sidebar>
          {/* Main chat area */}
          <main className="flex-1 flex flex-col items-center bg-[#f8fafc]">
            <div className="w-full max-w-2xl flex flex-col flex-1">
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-black px-6 py-4 bg-white/90">
                <div className="font-semibold text-lg">
                  Improvement Suggestions for Proposal
                </div>
              </div>
              {/* Message list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[70%] ${
                        msg.from === "user"
                          ? "bg-blue-200 text-right"
                          : "bg-gray-200"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              {/* Message input */}
              <form
                className="flex items-center border-t border-black bg-white/90 px-4 py-3 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Input
                  className="flex-1 border-2 border-black rounded-lg"
                  placeholder="Enter your message here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button type="submit" variant="default" className="rounded-lg">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

import Header from "@/components/Header";

export default function Chat() {
  return (
    <div className="min-h-screen bg-primary">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen pt-24 px-2 sm:px-0">
        <div className="text-6xl font-bold">Chat</div>
        <div className="text-lg mt-4 italic">Support coming soon...</div>
      </div>
    </div>
  );
}

import React from "react";
import { Card } from "../components/ui/card";
import MainCard from "../components/MainCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center">
      <div className="relative w-full max-w-xl mb-8">
        <Card className="bg-white rounded-xl shadow-lg p-8 border-4 border-black">
          <MainCard />
        </Card>
      </div>
    </div>
  );
}

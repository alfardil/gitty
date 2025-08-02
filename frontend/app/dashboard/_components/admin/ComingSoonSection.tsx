import { Clock, Construction } from "lucide-react";

interface ComingSoonSectionProps {
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoonSection({
  title,
  description,
  features,
}: ComingSoonSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-12 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Construction className="w-16 h-16 text-yellow-400 mb-4" />
            <Clock className="w-8 h-8 text-gray-500 absolute -top-2 -right-2" />
          </div>

          <div>
            <h4 className="text-2xl font-bold text-white mb-2">Coming Soon</h4>
            <p className="text-gray-400 max-w-md">
              This feature is currently under development and will be available
              in a future update.
            </p>
          </div>

          {features && features.length > 0 && (
            <div className="mt-8">
              <h5 className="text-lg font-semibold text-white mb-4">
                Planned Features:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-400"
                  >
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

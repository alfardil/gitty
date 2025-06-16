import { Button } from "@/components/ui/neo/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/neo/card";
import { Input } from "@/components/ui/neo/input";
import {
  Github,
  Star,
  MessageCircle,
  Zap,
  FileText,
  Brain,
  Code,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-40 left-16 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute top-60 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-base border-2 border-black flex items-center justify-center">
              <Code className="w-4 h-4 text-black font-bold" />
            </div>
            <span className="text-2xl font-bold text-white">GITTY</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-white/80">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#docs" className="hover:text-white transition-colors">
              Docs
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4 text-white/80">
            <a
              href="#"
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Discord</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>2.1k</span>
              <Star className="w-3 h-3" />
            </a>
          </div>
          <Button
            variant="noShadow"
            className="text-white bg-transparent border-white/20 hover:bg-white/10"
          >
            Log In
          </Button>
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 border-black">
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Understand your
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              codebase instantly
            </span>
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            AI-powered GitHub repository analysis that provides comprehensive
            insights, system architecture visualization, and intelligent code
            navigation for developers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button
              size="lg"
              className="bg-cyan-400 text-black hover:bg-cyan-300 border-black text-lg px-8"
            >
              <Sparkles className="w-5 h-5" />
              Start Analyzing
            </Button>
            <Button
              size="lg"
              variant="noShadow"
              className="text-white bg-transparent border-white/30 hover:bg-white/10 text-lg px-8"
            >
              View Demo
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mt-20">
          {/* Repository Analysis Card */}
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-base border-2 border-black flex items-center justify-center">
                  <Brain className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    Repository Intelligence
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Comprehensive GitHub analysis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Full codebase contextualization</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Function entry point identification</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Component navigation mapping</span>
              </div>
            </CardContent>
          </Card>

          {/* System Design Card */}
          <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-base border-2 border-black flex items-center justify-center">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    System Visualization
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Automated architecture diagrams
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Instant system design generation</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>API endpoint documentation</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Routing logic visualization</span>
              </div>
            </CardContent>
          </Card>

          {/* Developer Tools Card */}
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-base border-2 border-black flex items-center justify-center">
                  <Code className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    Developer Productivity
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Integrated development tools
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Integrated chatbot assistance</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Quick codebase queries</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Streamlined project setup</span>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Card */}
          <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-400/30 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-base border-2 border-black flex items-center justify-center">
                  <FileText className="w-6 h-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">
                    Smart Documentation
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Automated code documentation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Function and file summaries</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Module documentation</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>VS Code extension (coming soon)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to understand your codebase?
          </h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Join developers who are already using Gitty to navigate and
            understand their repositories with AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Input
              placeholder="Enter your GitHub repository URL"
              className="max-w-md bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button className="bg-cyan-400 text-black hover:bg-cyan-300 border-black">
              <Sparkles className="w-4 h-4" />
              Analyze Repository
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Code2, Zap, Database, CreditCard, Terminal, Play } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">CodeIDE</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            Code Anywhere, Anytime
          </h1>
          <p className="mb-8 text-xl text-slate-400 leading-relaxed">
            A powerful in-browser IDE with multi-language support. Write, execute, and save your code with 100 free executions to get started.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Coding Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-800">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <Code2 className="mb-4 h-10 w-10 text-blue-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">Multi-Language Support</h3>
            <p className="text-slate-400">
              Write code in JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, Ruby, and more.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <Zap className="mb-4 h-10 w-10 text-yellow-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">Instant Execution</h3>
            <p className="text-slate-400">
              Run your code instantly with client-side execution for JS/TS and Piston API for other languages.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <Database className="mb-4 h-10 w-10 text-green-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">Cloud Storage</h3>
            <p className="text-slate-400">
              Save your code snippets securely in the cloud with Supabase authentication and storage.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <Terminal className="mb-4 h-10 w-10 text-purple-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">Integrated Terminal</h3>
            <p className="text-slate-400">
              Built-in terminal with command history to view output and interact with your code.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <Play className="mb-4 h-10 w-10 text-red-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">100 Free Executions</h3>
            <p className="text-slate-400">
              Get started with 100 free code executions. Upgrade for unlimited access.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
            <CreditCard className="mb-4 h-10 w-10 text-cyan-500" />
            <h3 className="mb-2 text-xl font-semibold text-white">Flexible Pricing</h3>
            <p className="text-slate-400">
              Support development with Buy Me a Coffee for unlimited executions and premium features.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/50 p-12 backdrop-blur">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Start Coding?</h2>
          <p className="mb-8 text-lg text-slate-400">
            Join thousands of developers using CodeIDE to write and execute code in the browser.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-8">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <p>&copy; 2024 CodeIDE. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  )
}

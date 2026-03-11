"use client"

import Image from "next/image"
import { Quote, Code, Zap, Terminal, Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "Volt has completely changed how I practice coding. I can test algorithms in Python, then immediately switch to JavaScript - all without leaving my browser. The instant execution is incredible.",
    name: "Sarah Chen",
    role: "Software Engineer",
    company: "Google",
    avatar: "/images/avatars/annette-black.png",
    rating: 5,
    language: "Python",
  },
  {
    quote:
      "As a CS professor, I use Volt for all my live coding demos. Students can follow along and run code instantly without any setup headaches.",
    name: "Dr. James Miller",
    role: "Professor",
    company: "MIT",
    avatar: "/images/avatars/dianne-russell.png",
    rating: 5,
    language: "Java",
  },
  {
    quote:
      "The built-in terminal makes Volt feel like a real development environment. I've used it for technical interviews and quick prototyping.",
    name: "Alex Rodriguez",
    role: "Full Stack Developer",
    company: "Stripe",
    avatar: "/images/avatars/cameron-williamson.png",
    rating: 5,
    language: "TypeScript",
  },
  {
    quote:
      "60+ languages in one place! I switch between Rust, Go, and C++ daily for competitive programming. Volt handles them all perfectly.",
    name: "Priya Sharma",
    role: "Competitive Programmer",
    company: "LeetCode Top 100",
    avatar: "/images/avatars/robert-fox.png",
    rating: 5,
    language: "Rust",
  },
  {
    quote:
      "No more 'it works on my machine' excuses. I share Volt links with my team and everyone sees the same output instantly.",
    name: "Marcus Johnson",
    role: "Tech Lead",
    company: "Shopify",
    avatar: "/images/avatars/darlene-robertson.png",
    rating: 5,
    language: "Ruby",
  },
  {
    quote:
      "I learned Python entirely on Volt. The syntax highlighting and instant feedback made it so easy to experiment and learn.",
    name: "Emma Wilson",
    role: "Junior Developer",
    company: "Bootcamp Graduate",
    avatar: "/images/avatars/cody-fisher.png",
    rating: 5,
    language: "Python",
  },
]

const LanguageBadge = ({ language }: { language: string }) => {
  const colors: Record<string, string> = {
    Python: "bg-[#3776ab]/20 text-[#3776ab] border-[#3776ab]/30",
    Java: "bg-[#f89820]/20 text-[#f89820] border-[#f89820]/30",
    TypeScript: "bg-[#3178c6]/20 text-[#3178c6] border-[#3178c6]/30",
    Rust: "bg-[#dea584]/20 text-[#dea584] border-[#dea584]/30",
    Ruby: "bg-[#cc342d]/20 text-[#cc342d] border-[#cc342d]/30",
  }
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[language] || "bg-primary/20 text-primary border-primary/30"}`}>
      {language}
    </span>
  )
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[...Array(rating)].map((_, i) => (
      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
    ))}
  </div>
)

const TestimonialCard = ({ quote, name, role, company, avatar, rating, language, featured = false }: {
  quote: string
  name: string
  role: string
  company: string
  avatar: string
  rating: number
  language: string
  featured?: boolean
}) => {
  if (featured) {
    return (
      <div className="relative group">
        {/* Animated gradient border */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex flex-col justify-between p-8 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl h-full min-h-[320px] overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Quote className="w-8 h-8 text-amber-500/50" />
              <LanguageBadge language={language} />
            </div>
            <p className="text-white text-xl font-medium leading-relaxed">{quote}</p>
          </div>
          
          <div className="relative z-10 flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={avatar}
                  alt={name}
                  width={48}
                  height={48}
                  className="rounded-full ring-2 ring-amber-500/50"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white font-semibold">{name}</p>
                <p className="text-white/60 text-sm">{role} at {company}</p>
              </div>
            </div>
            <StarRating rating={rating} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col justify-between p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full">
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Quote className="w-5 h-5 text-primary/40" />
          <LanguageBadge language={language} />
        </div>
        <p className="text-foreground/80 text-[15px] leading-relaxed">{quote}</p>
      </div>
      
      <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2.5">
          <Image
            src={avatar}
            alt={name}
            width={36}
            height={36}
            className="rounded-full ring-1 ring-border"
          />
          <div>
            <p className="text-foreground text-sm font-medium">{name}</p>
            <p className="text-muted-foreground text-xs">{company}</p>
          </div>
        </div>
        <StarRating rating={rating} />
      </div>
    </div>
  )
}

export function TestimonialGridSection() {
  return (
    <section className="w-full px-5 overflow-hidden py-12 md:py-16 lg:py-24">
      {/* Section header */}
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Loved by 50,000+ developers</span>
        </div>
        <h2 className="text-foreground text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          Developers Love Volt
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
          From students to senior engineers, see why developers choose Volt for instant code execution
        </p>
      </div>

      {/* Testimonials grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured testimonial - spans 2 columns on large screens */}
          <div className="md:col-span-2 lg:col-span-2">
            <TestimonialCard {...testimonials[0]} featured />
          </div>
          
          {/* Regular testimonials */}
          <div className="space-y-6">
            <TestimonialCard {...testimonials[1]} />
            <TestimonialCard {...testimonials[2]} />
          </div>
          
          <TestimonialCard {...testimonials[3]} />
          <TestimonialCard {...testimonials[4]} />
          <TestimonialCard {...testimonials[5]} />
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-4xl mx-auto mt-16 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground">60+</div>
            <div className="text-sm text-muted-foreground mt-1">Languages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground">50K+</div>
            <div className="text-sm text-muted-foreground mt-1">Developers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground">1M+</div>
            <div className="text-sm text-muted-foreground mt-1">Code Runs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground">{"<"}1s</div>
            <div className="text-sm text-muted-foreground mt-1">Execution Time</div>
          </div>
        </div>
      </div>
    </section>
  )
}

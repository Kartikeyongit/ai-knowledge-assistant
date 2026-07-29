"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { setAuthTokenGetter } from "@/lib/api";
import { HeroSection } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { StatsSection } from "@/components/landing/stats";
import { TechStackSection } from "@/components/landing/tech-stack";
import { DemoChatSection } from "@/components/landing/demo-chat";
import { FAQSection } from "@/components/landing/faq";
import { FooterSection } from "@/components/landing/footer";
import { PageBackground } from "@/components/landing/page-background";

export default function HomePage() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        rightContent={
          isSignedIn ? (
            <>
              <Link href="/documents"><Button variant="ghost" size="sm">Documents</Button></Link>
              <Link href="/chat"><Button variant="default" size="sm">Start Chatting</Button></Link>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button variant="default" size="sm">
                  <LogIn className="size-3.5 mr-1.5" />
                  Get Started
                </Button>
              </SignInButton>
            </>
          )
        }
      />

      <main className="flex-1 relative">
        <PageBackground />
        <HeroSection />

        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-700/50 to-transparent" />
        </div>
        <FeaturesSection />

        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-700/50 to-transparent" />
        </div>
        <HowItWorksSection />

        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-700/50 to-transparent" />
        </div>
        <StatsSection />

        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-700/50 to-transparent" />
        </div>
        <TechStackSection />

        <div className="max-w-6xl mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-700/50 to-transparent" />
        </div>
        {!isSignedIn && <DemoChatSection />}

        {!isSignedIn && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-300/50 dark:via-neutral-700/50 to-transparent" />
          </div>
        )}
        <FAQSection />
      </main>

      <FooterSection />
    </div>
  );
}

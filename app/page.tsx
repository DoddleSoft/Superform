import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Welcome to Superform</h1>
          <p className="py-6">
            The easiest way to build forms for your business. Sign up to get started.
          </p>
          <div className="flex gap-4 justify-center items-center flex-col sm:flex-row">
            <SignedOut>
              <Link
                href="/sign-up"
                className="btn btn-primary"
              >
                Sign Up
              </Link>
              <Link
                href="/sign-in"
                className="link link-hover"
              >
                Already have an account? Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="btn btn-primary"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
          <div className="mt-8 flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}

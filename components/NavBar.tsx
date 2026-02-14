"use client";
import React, { useState, useEffect } from "react";
import Button from "./Button";
import Link from "next/link";
import UserProfile from "./auth-components/UserProfile";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

const NavBar = () => {
  const [pathname, setPathname] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  // Close mobile menu when clicking outside or on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const navItems = ["Home", "Dashboard", "Research", "Mentor"];

  return (
    <nav className="min-h-[100px] items-center flex sm:px-10 px-4 justify-between safe-area-inset">
      <div className="flex items-center gap-3">
        <Link href={"/"} className="flex items-center gap-3">
          <span className="logo">
            Inter<span className="highlight">View</span>ture
          </span>
          {pathname !== "/" && pathname !== "/dashboard" && pathname !== "/login" && (
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white sm:text-3xl">
            </h2>
          )}
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="max-lg:hidden">
        <ul className="flex font-[500] text-[var(--nav-text)] text-lg gap-18 items-center">
          {navItems.map((item, index) => {
            const link = item === "Home" ? "/" : `/${item.toLowerCase()}`;
            return (
              <li key={index} className="relative nav-hover">
                <Link
                  href={link}
                  className={`${pathname === link ? "font-bold" : ""}`}
                >
                  {item}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile Menu Button - Touch-friendly 48px target */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center text-gray-900 dark:text-white rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="flex flex-col gap-1.5">
            <div className={`w-6 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></div>
            <div className={`w-6 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}></div>
            <div className={`w-6 h-0.5 bg-gray-900 dark:bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></div>
          </div>
        </button>
      </div>

      {/* Desktop Auth */}
      <div className="max-lg:hidden flex items-center gap-6 mr-5">
        {isAuthenticated ? (
          <UserProfile />
        ) : (
          <Link href="/login">
            <Button name="Start Now" />
          </Link>
        )}
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Slide-in Panel */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-[280px] max-w-[80vw] bg-[var(--background)] z-50 transform transition-transform duration-300 ease-out shadow-xl ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Menu Items */}
        <ul className="flex flex-col font-[500] text-[var(--nav-text)] text-lg p-4">
          {navItems.map((item, index) => {
            const link = item === "Home" ? "/" : `/${item.toLowerCase()}`;
            return (
              <li key={index}>
                <Link
                  href={link}
                  className={`block py-4 px-2 min-h-[48px] flex items-center border-b border-gray-200 dark:border-gray-700 active:bg-gray-100 dark:active:bg-gray-800 rounded transition-colors ${pathname === link ? "font-bold text-gray-900 dark:text-white" : ""
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              </li>
            );
          })}
          <li className="pt-6">
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button name="Start Now" />
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;


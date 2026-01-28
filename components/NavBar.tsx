"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Button from "./Button";
import Link from "next/link";
import UserProfile from "./auth-components/UserProfile";
import { useAuth } from "@/context/AuthContext";

const NavBar = () => {
  const [pathname, setPathname] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const navItems = ["Home", "Dashboard", "Research", "Mentor"];

  return (
    <nav className="min-h-[100px] items-center flex sm:px-10 px-8 justify-between">
      <div className="flex items-center gap-3">
        <Link href={"/"} className="flex items-center gap-3">
          <Image width={60} height={60} src="/images/Logo.svg" alt="Logo" />
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

      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-900 dark:text-white p-2"
          aria-label="Toggle mobile menu"
        >
          <div className="w-6 h-0.5 bg-gray-900 dark:bg-white mb-1.5 transition-all"></div>
          <div className="w-6 h-0.5 bg-gray-900 dark:bg-white mb-1.5 transition-all"></div>
          <div className="w-6 h-0.5 bg-gray-900 dark:bg-white transition-all"></div>
        </button>
      </div>

      {/* Desktop Auth */}
      <div className="max-lg:hidden flex items-center gap-6">
        {isAuthenticated ? (
          <UserProfile />
        ) : (
          <Link href="/login">
            <Button name="Start Now" />
          </Link>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-[100px] left-0 right-0 bg-[var(--background)] border-t border-gray-700 z-50">
          <ul className="flex flex-col font-[500] text-[var(--nav-text)] text-lg p-4">
            {navItems.map((item, index) => {
              const link = item === "Home" ? "/" : `/${item.toLowerCase()}`;
              return (
                <li key={index} className="py-3 border-b border-gray-700">
                  <Link
                    href={link}
                    className={`${pathname === link ? "font-bold text-gray-900 dark:text-white" : ""}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item}
                  </Link>
                </li>
              );
            })}
            <li className="py-4">
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
      )}
    </nav>
  );
};

export default NavBar;

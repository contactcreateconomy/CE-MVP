"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { MOCK_NOTIFICATIONS, CURRENT_USER } from "@/lib/mock-data";
import { slideDown } from "@/lib/animations";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <nav
      className="sticky top-0 z-50 glass gradient-border-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-6">
        {/* Left: Logo + Name */}
        <div className="flex items-center gap-2.5">
          <Logo size={30} />
          <span className="text-lg font-bold tracking-tight hidden sm:block">
            Createconomy
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Search — desktop: animated expand, mobile: always shown in menu */}
          <div className="hidden md:flex items-center">
            <motion.div
              className="relative flex items-center"
              animate={searchOpen ? "expanded" : "collapsed"}
            >
              {searchOpen ? (
                <motion.div
                  initial={{ width: 40, opacity: 0.5 }}
                  animate={{ width: 300, opacity: 1 }}
                  exit={{ width: 40, opacity: 0.5 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search discussions..."
                    className="h-9 w-full rounded-lg border bg-background/50 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:glow-primary transition-shadow"
                    onBlur={() => setSearchOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                    aria-label="Search discussions"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:glow-primary transition-shadow duration-200"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Open search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 hover:glow-primary transition-shadow duration-200"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={notifOpen}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  variants={slideDown}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-popover p-0 shadow-lg overflow-hidden"
                  role="region"
                  aria-label="Notifications"
                >
                  <div className="border-b px-4 py-3">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {MOCK_NOTIFICATIONS.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer",
                          !n.isRead && "bg-primary/5"
                        )}
                      >
                        {n.avatar ? (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={n.avatar} />
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bell className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug">{n.message}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {n.timestamp}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:glow-primary transition-shadow duration-200"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={CURRENT_USER.avatar} alt={CURRENT_USER.name} />
                  <AvatarFallback>{CURRENT_USER.name[0]}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{CURRENT_USER.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{CURRENT_USER.username}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile search bar — always expanded on mobile */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search discussions..."
            className="h-9 w-full rounded-lg border bg-background/50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            aria-label="Search discussions"
          />
        </div>
      </div>
    </nav>
  );
}

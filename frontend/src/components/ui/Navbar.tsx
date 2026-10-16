import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Info,
  Car,
  CalendarCheck,
  MessageCircle,
  Phone,
  LogIn,
  UserPlus,
  Menu,
  X,
  User,
  LogOut,
  CalendarDays,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface NavLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  isAnchor?: boolean;
}

interface User {
  name: string;
  email: string;
  role: "client" | "agent" | "admin" | "fleet_manager";
}

interface NavbarProps {
  user?: User | null;
  onLogout?: () => void;
}

// ─── Données de navigation ────────────────────────────────────────────────────
const NAV_LINKS: NavLink[] = [
  { label: "Accueil",      href: "/",            icon: <Home size={15} />,          isAnchor: false },
  { label: "Nos voitures", href: "/#voitures",   icon: <Car size={15} />,           isAnchor: true  },
  { label: "Réservation",  href: "/reservation", icon: <CalendarCheck size={15} />, isAnchor: false },
  { label: "Témoignages",  href: "/#temoignages",icon: <MessageCircle size={15} />, isAnchor: true  },
  { label: "À propos",     href: "/#apropos",    icon: <Info size={15} />,          isAnchor: true  },
  { label: "Contact",      href: "/contact",     icon: <Phone size={15} />,         isAnchor: false },
];

// ─── Rôles → chemin dashboard ────────────────────────────────────────────────
const ROLE_DASHBOARD: Record<string, string> = {
  client:        "/client/dashboard",
  agent:         "/agent/dashboard",
  admin:         "/admin/dashboard",
  fleet_manager: "/fleet-manager/dashboard",
};

// ─── Composant NavItem Desktop ────────────────────────────────────────────────
function NavItem({ link, isActive }: { link: NavLink; isActive: boolean }) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (link.isAnchor) {
      e.preventDefault();
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const id = link.href.replace("/#", "");
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const id = link.href.replace("/#", "");
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <a
      href={link.href}
      onClick={handleClick}
      className={`
        group relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isActive
          ? "text-red-600 bg-red-50"
          : "text-gray-600 hover:text-red-600 hover:bg-red-50"
        }
      `}
    >
      <span className={`transition-colors ${isActive ? "text-red-600" : "text-gray-400 group-hover:text-red-500"}`}>
        {link.icon}
      </span>
      {link.label}
      {isActive && (
        <span className="absolute bottom-0 inset-x-3 h-0.5 bg-red-600 rounded-full" />
      )}
    </a>
  );
}

// ─── Dropdown utilisateur connecté ───────────────────────────────────────────
function UserDropdown({ user, onLogout }: { user: User; onLogout?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dashboard = ROLE_DASHBOARD[user.role] ?? "/client/dashboard";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header dropdown */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium capitalize">
              {user.role === "fleet_manager" ? "Resp. parc" : user.role}
            </span>
          </div>

          {/* Liens */}
          <div className="py-1">
            <Link
              to={dashboard}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={() => setOpen(false)}
            >
              <User size={15} className="text-gray-400" />
              Mon espace
            </Link>

            {user.role === "client" && (
              <>
                <Link
                  to="/client/reservations"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <CalendarDays size={15} className="text-gray-400" />
                  Mes réservations
                </Link>
                <Link
                  to="/client/contrats"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <FileText size={15} className="text-gray-400" />
                  Mes contrats
                </Link>
              </>
            )}
          </div>

          {/* Déconnexion */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant principal Navbar ───────────────────────────────────────────────
function Navbar({ user = null, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (link: NavLink): boolean => {
    if (link.isAnchor) return false;
    if (link.href === "/") return location.pathname === "/";
    return location.pathname.startsWith(link.href);
  };

  const handleAnchorMobile = (link: NavLink) => {
    setIsMenuOpen(false);
    if (link.isAnchor) {
      if (window.location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const id = link.href.replace("/#", "");
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const id = link.href.replace("/#", "");
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 shadow-md">
            <Car size={17} color="white" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <strong className="text-[15px] font-bold text-gray-900 tracking-tight">
              K-JOU
            </strong>
            <span className="block text-[10px] text-gray-400 font-medium tracking-wider uppercase">
              Rent a Car
            </span>
          </div>
        </Link>

        {/* ── Nav desktop ── */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.href} link={link} isActive={isActive(link)} />
          ))}
        </nav>

        {/* ── Actions desktop ── */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <UserDropdown user={user} onLogout={onLogout} />
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                <LogIn size={15} />
                Connexion
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium shadow-sm hover:shadow-md hover:from-red-700 hover:to-red-800 transition-all duration-200"
              >
                <UserPlus size={15} />
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* ── Bouton menu mobile ── */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Menu mobile ── */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="flex flex-col p-3 gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.isAnchor ? link.href : undefined}
                onClick={() => handleAnchorMobile(link)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isActive(link)
                    ? "bg-red-50 text-red-600"
                    : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                  }
                `}
              >
                <span className={isActive(link) ? "text-red-500" : "text-gray-400"}>
                  {link.icon}
                </span>
                {link.label}
              </a>
            ))}

            {/* Actions mobile */}
            <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to={ROLE_DASHBOARD[user.role] ?? "/client/dashboard"}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={17} className="text-gray-400" /> Mon espace
                  </Link>
                  {user.role === "client" && (
                    <>
                      <Link
                        to="/client/reservations"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <CalendarDays size={17} className="text-gray-400" /> Mes réservations
                      </Link>
                      <Link
                        to="/client/contrats"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText size={17} className="text-gray-400" /> Mes contrats
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => { setIsMenuOpen(false); onLogout?.(); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all"
                  >
                    <LogOut size={17} /> Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LogIn size={17} /> Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium transition-all hover:from-red-700 hover:to-red-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus size={17} /> S'inscrire
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
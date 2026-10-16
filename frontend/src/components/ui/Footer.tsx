// footer.tsx
import { Link } from "react-router-dom";

interface SocialIconProps {
  path: string;
  label: string;
}

const SocialIcon = ({ path, label }: SocialIconProps) => (
  <a
    href="#"
    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-900 rounded-lg transition-all duration-200"
    aria-label={label}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  </a>
);

export function Footer() {
  const navigationLinks = [
    { name: "Accueil", href: "#accueil" },
    { name: "Nos voitures", href: "#voitures" },
    { name: "Avantages", href: "#avantages" },
    { name: "Comment ça marche", href: "#comment" },
    { name: "Témoignages", href: "#temoignages" },
  ];

  const supportLinks = [
    { name: "FAQ", href: "#" },
    { name: "Annulation", href: "#" },
    { name: "Assurances", href: "#" },
    { name: "Documents requis", href: "#" },
    { name: "Assistance 24/7", href: "#" },
  ];

  const socialLinks = [
    { path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", label: "Facebook" },
    { path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M2 2h20v20H2z", label: "Instagram" },
    { path: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z", label: "WhatsApp" },
    { path: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z", label: "Twitter" },
    { path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z", label: "LinkedIn" },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer id="contact" className="bg-black text-white border-t">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:px-6">
        
        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* BRAND SECTION */}
          <div className="space-y-4">
            <Link 
              to="/" 
              className="flex items-center gap-3 group transition-transform hover:scale-105"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700 shadow-md">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="15" cy="17" r="2"/>
                  <path d="M5 9l2-4h6l2 4"/>
                </svg>
              </div>
              <strong className="text-xl text-white">
                K-JOU RENT A CAR
              </strong>
            </Link>
            
            <p className="text-sm text-gray-300 leading-relaxed">
              La référence de la location de voitures premium en Haïti. Confort, fiabilité et service exceptionnel depuis 2018. 🇭🇹
            </p>
            
            {/* SOCIAL LINKS */}
            <div className="flex gap-1 pt-2">
              {socialLinks.map((social, index) => (
                <SocialIcon key={index} path={social.path} label={social.label} />
              ))}
            </div>
          </div>

          {/* NAVIGATION COLUMN */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2">
              {navigationLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-sm text-gray-400 hover:text-red-500 hover:translate-x-1 transition-all duration-200 inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT COLUMN */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-red-500 hover:translate-x-1 transition-all duration-200 inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* NEWSLETTER COLUMN */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Newsletter
            </h3>
            <p className="text-sm text-gray-300 mb-3 leading-relaxed">
              Recevez nos offres exclusives et nouveaux véhicules directement dans votre boîte mail.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <button className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aucun spam. Désabonnement en 1 clic.
            </p>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; 2026{" "}
            <a href="#accueil" className="hover:text-red-500 transition-colors">
              K-JOU Rent a Car
            </a>
            . Tous droits réservés.
          </p>
          <nav className="flex gap-6">
            {["Mentions légales", "Confidentialité", "CGU"].map((item, index) => (
              <a
                key={index}
                href="#"
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
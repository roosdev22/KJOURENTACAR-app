import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Country {
  code: string;   // ISO 3166-1 alpha-2
  name: string;
  dial: string;   // indicatif ex: +509
  flag: string;   // emoji drapeau
  mask?: string;  // format ex: XXXX-XXXX
}

interface PhoneInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  defaultCountry?: string; // code ISO ex: "HT"
}

// ─── Liste des pays ───────────────────────────────────────────────────────────
const COUNTRIES: Country[] = [
  { code: "HT", name: "Haïti",             dial: "+509", flag: "🇭🇹", mask: "XXXX XXXX"        },
  { code: "FR", name: "France",            dial: "+33",  flag: "🇫🇷", mask: "XX XX XX XX XX"   },
  { code: "US", name: "États-Unis",        dial: "+1",   flag: "🇺🇸", mask: "XXX XXX XXXX"     },
  { code: "CA", name: "Canada",            dial: "+1",   flag: "🇨🇦", mask: "XXX XXX XXXX"     },
  { code: "DO", name: "Rép. Dominicaine",  dial: "+1",   flag: "🇩🇴", mask: "XXX XXX XXXX"     },
  { code: "MX", name: "Mexique",           dial: "+52",  flag: "🇲🇽", mask: "XX XXXX XXXX"     },
  { code: "BR", name: "Brésil",            dial: "+55",  flag: "🇧🇷", mask: "XX XXXXX XXXX"    },
  { code: "CO", name: "Colombie",          dial: "+57",  flag: "🇨🇴", mask: "XXX XXX XXXX"     },
  { code: "VE", name: "Venezuela",         dial: "+58",  flag: "🇻🇪", mask: "XXX XXX XXXX"     },
  { code: "CU", name: "Cuba",              dial: "+53",  flag: "🇨🇺", mask: "X XXX XXXX"       },
  { code: "JM", name: "Jamaïque",          dial: "+1",   flag: "🇯🇲", mask: "XXX XXX XXXX"     },
  { code: "TT", name: "Trinidad & Tobago", dial: "+1",   flag: "🇹🇹", mask: "XXX XXX XXXX"     },
  { code: "GP", name: "Guadeloupe",        dial: "+590", flag: "🇬🇵", mask: "XXX XX XX XX"     },
  { code: "MQ", name: "Martinique",        dial: "+596", flag: "🇲🇶", mask: "XXX XX XX XX"     },
  { code: "GF", name: "Guyane française",  dial: "+594", flag: "🇬🇫", mask: "XXX XX XX XX"     },
  { code: "SN", name: "Sénégal",           dial: "+221", flag: "🇸🇳", mask: "XX XXX XX XX"     },
  { code: "CI", name: "Côte d'Ivoire",     dial: "+225", flag: "🇨🇮", mask: "XX XX XX XX XX"   },
  { code: "CM", name: "Cameroun",          dial: "+237", flag: "🇨🇲", mask: "XXXX XXXX"        },
  { code: "MA", name: "Maroc",             dial: "+212", flag: "🇲🇦", mask: "XXX XXX XXX"      },
  { code: "TN", name: "Tunisie",           dial: "+216", flag: "🇹🇳", mask: "XX XXX XXX"       },
  { code: "DZ", name: "Algérie",           dial: "+213", flag: "🇩🇿", mask: "XXX XX XX XX"     },
  { code: "GB", name: "Royaume-Uni",       dial: "+44",  flag: "🇬🇧", mask: "XXXX XXXXXX"      },
  { code: "DE", name: "Allemagne",         dial: "+49",  flag: "🇩🇪", mask: "XXXX XXXXXXX"     },
  { code: "ES", name: "Espagne",           dial: "+34",  flag: "🇪🇸", mask: "XXX XXX XXX"      },
  { code: "IT", name: "Italie",            dial: "+39",  flag: "🇮🇹", mask: "XXX XXX XXXX"     },
  { code: "PT", name: "Portugal",          dial: "+351", flag: "🇵🇹", mask: "XXX XXX XXX"      },
  { code: "BE", name: "Belgique",          dial: "+32",  flag: "🇧🇪", mask: "XXX XX XX XX"     },
  { code: "CH", name: "Suisse",            dial: "+41",  flag: "🇨🇭", mask: "XXX XXX XX XX"    },
  { code: "CN", name: "Chine",             dial: "+86",  flag: "🇨🇳", mask: "XXX XXXX XXXX"    },
  { code: "JP", name: "Japon",             dial: "+81",  flag: "🇯🇵", mask: "XX XXXX XXXX"     },
];

// ─── Composant PhoneInput ─────────────────────────────────────────────────────
export function PhoneInput({
  label,
  name,
  value,
  onChange,
  error,
  required,
  optional,
  placeholder,
  defaultCountry = "HT",
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Fermer en cliquant dehors ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Focus search quand dropdown s'ouvre ──────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [isOpen]);

  // ── Filtrer pays ──────────────────────────────────────────────────────────
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  // ── Sélectionner un pays ──────────────────────────────────────────────────
  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    onChange(""); // reset numéro quand on change de pays
  };

  // ── Valeur complète ───────────────────────────────────────────────────────
  const fullValue = value ? `${selectedCountry.dial} ${value}` : "";

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      <label htmlFor={name} className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {optional && <span className="text-gray-400 ml-1 normal-case font-normal">(optionnel)</span>}
      </label>

      <div className="relative flex gap-0" ref={dropdownRef}>

        {/* ── Bouton indicatif pays ── */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-1.5 px-3 py-2.5 border rounded-l-lg bg-white text-sm
            transition-all duration-200 shrink-0 hover:bg-gray-50
            ${isOpen
              ? "border-red-500 ring-2 ring-red-200 z-10"
              : error
              ? "border-red-400"
              : "border-gray-200 hover:border-gray-300"
            }
          `}
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
          <span className="text-gray-700 font-medium text-xs tabular-nums">{selectedCountry.dial}</span>
          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* ── Input numéro ── */}
        <input
          id={name}
          name={name}
          type="tel"
          value={value}
          onChange={(e) => {
            // Accepter seulement chiffres et espaces
            const raw = e.target.value.replace(/[^\d\s-]/g, "");
            onChange(raw);
          }}
          placeholder={placeholder ?? selectedCountry.mask?.replace(/X/g, "0") ?? "XXXX XXXX"}
          className={`
            flex-1 px-3 py-2.5 border-y border-r rounded-r-lg text-sm
            transition-all duration-200 outline-none bg-white
            ${error
              ? "border-red-400 focus:ring-2 focus:ring-red-200 focus:border-red-500"
              : "border-gray-200 focus:ring-2 focus:ring-red-200 focus:border-red-500"
            }
          `}
        />

        {/* ── Dropdown pays ── */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

            {/* Barre de recherche */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un pays..."
                  className="w-full pl-7 pr-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
              </div>
            </div>

            {/* Pays sélectionné en haut */}
            <div className="px-2 py-1.5 border-b border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-1 mb-1">
                Sélection actuelle
              </p>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-50 border border-red-100">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-xs font-medium text-gray-800 flex-1">{selectedCountry.name}</span>
                <span className="text-xs font-bold text-red-600 tabular-nums">{selectedCountry.dial}</span>
              </div>
            </div>

            {/* Liste des pays */}
            <div className="overflow-y-auto max-h-52">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  Aucun pays trouvé
                </div>
              ) : (
                filtered.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs
                      transition-colors duration-150 hover:bg-red-50
                      ${selectedCountry.code === country.code
                        ? "bg-red-50 text-red-700"
                        : "text-gray-700"
                      }
                    `}
                  >
                    <span className="text-base shrink-0">{country.flag}</span>
                    <span className="flex-1 font-medium truncate">{country.name}</span>
                    <span className={`tabular-nums font-semibold shrink-0 ${selectedCountry.code === country.code ? "text-red-600" : "text-gray-400"}`}>
                      {country.dial}
                    </span>
                    {selectedCountry.code === country.code && (
                      <Check size={12} className="text-red-500 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Valeur complète en preview */}
      {value && (
        <p className="text-[11px] text-gray-400 mt-0.5">
          Numéro complet : <span className="font-medium text-gray-600">{fullValue}</span>
        </p>
      )}

      {/* Erreur */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Import manquant ──────────────────────────────────────────────────────────
import { Check } from "lucide-react";

export default PhoneInput;
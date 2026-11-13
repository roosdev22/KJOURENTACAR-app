import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Car, Shield, Clock, Star, ChevronRight, Phone, MapPin,
  ArrowRight, Check, Users, Calendar, Award, Fuel,
  Settings, ChevronLeft, Quote,
  Mail, Play, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vehicle {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  seats: number;
  transmission: string;
  fuel: string;
  rating: number;
  badge?: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
}

// ─── Données avec vos images locales ──────────────────────────────────────────
// METTEZ VOS IMAGES DANS LE DOSSIER "public/images/" OU "src/assets/images/"
// ET REMPLACEZ LES CHEMINS CI-DESSOUS PAR LES VÔTRES

const VEHICLES: Vehicle[] = [
  { id: 1, name: "Toyota RAV4",      category: "SUV",       price: 85,  image: "/frontend/src/assets/images/toyota-rav4.jpg", seats: 5, transmission: "Auto",    fuel: "Essence", rating: 4.9, badge: "Populaire"  },
  { id: 2, name: "Hyundai Tucson",   category: "SUV",       price: 75,  image: "/assets/images/Hyundai Tucson.jpg", seats: 5, transmission: "Auto",    fuel: "Essence", rating: 4.8, badge: "Nouveau"    },
  { id: 3, name: "Toyota Corolla",   category: "Berline",   price: 55,  image: "/assets/images/Toyota Corolla.jpg", seats: 5, transmission: "Manuel", fuel: "Essence", rating: 4.7                       },
  { id: 4, name: "Mitsubishi L200",  category: "Pick-up",   price: 95,  image: "/assets/images/Mitsubishi L200.jpg", seats: 5, transmission: "4x4",    fuel: "Diesel",  rating: 4.9, badge: "Best-seller" },
  { id: 5, name: "Toyota Hilux",     category: "Pick-up",   price: 100, image: "/assets/images/Toyota Hilux.jpg", seats: 5, transmission: "4x4",    fuel: "Diesel",  rating: 5.0, badge: "Premium"    },
  { id: 6, name: "Kia Sportage",     category: "SUV",       price: 70,  image: "/assets/images/Kia Sportage.jpg", seats: 5, transmission: "Auto",    fuel: "Essence", rating: 4.6                       },
];

const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Jean-Marc Étienne",  role: "Homme d'affaires",    avatar: "JE", rating: 5, comment: "Service exceptionnel ! Le véhicule était impeccable et l'équipe très professionnelle. Je recommande vivement K-JOU pour tous vos déplacements à Cap-Haïtien.", date: "Mars 2026"  },
  { id: 2, name: "Marie-Claire Louis", role: "Voyageuse",           avatar: "ML", rating: 5, comment: "J'ai loué un SUV pour explorer le nord d'Haïti. Le processus de réservation en ligne était simple et rapide. Véhicule en parfait état, prix très compétitif.", date: "Févr. 2026" },
  { id: 3, name: "Pierre Desrosiers",  role: "Directeur commercial", avatar: "PD", rating: 5, comment: "K-JOU RENT A CAR est ma référence depuis 2 ans. Disponibilité 24/7, équipe réactive et flotte de véhicules bien entretenue. Parfait pour les missions professionnelles.", date: "Janv. 2026" },
  { id: 4, name: "Sophie Belizaire",   role: "Touriste",            avatar: "SB", rating: 4, comment: "Très bonne expérience pour découvrir la région de Cap-Haïtien. Personnel accueillant et prix raisonnables. Je reviendrai lors de mon prochain voyage en Haïti.", date: "Déc. 2025"  },
];

const STATS: Stat[] = [
  { value: "500+", label: "Clients satisfaits",  icon: <Users size={22} />    },
  { value: "50+",  label: "Véhicules disponibles", icon: <Car size={22} />    },
  { value: "4",    label: "Années d'expérience",  icon: <Award size={22} />   },
  { value: "24/7", label: "Assistance client",    icon: <Clock size={22} />   },
];

const STEPS = [
  { num: "01", title: "Choisissez votre véhicule",    desc: "Parcourez notre catalogue en ligne et sélectionnez le véhicule adapté à vos besoins et votre budget.",        icon: <Car size={24} />      },
  { num: "02", title: "Faites votre réservation",     desc: "Remplissez le formulaire de réservation en ligne en quelques minutes. Paiement sécurisé en ligne ou en agence.", icon: <Calendar size={24} /> },
  { num: "03", title: "Récupérez votre véhicule",     desc: "Présentez-vous à notre agence de Vaudreuil avec votre permis de conduire valide. Votre véhicule vous attend !",  icon: <Check size={24} />    },
];

// ─── Composant Badge ──────────────────────────────────────────────────────────
function Badge({ text }: { text: string }) {
  const colors: Record<string, string> = {
    Populaire:   "bg-red-100 text-red-700 border-red-200",
    Nouveau:     "bg-blue-100 text-blue-700 border-blue-200",
    Premium:     "bg-amber-100 text-amber-700 border-amber-200",
    "Best-seller": "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border z-10 ${colors[text] ?? "bg-gray-100 text-gray-600"}`}>
      {text}
    </span>
  );
}

// ─── Composant Stars ──────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating}</span>
    </div>
  );
}

// ─── VehicleCard ──────────────────────────────────────────────────────────────
function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const [hovered, setHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden group
        ${hovered ? "border-red-200 shadow-xl shadow-red-50 -translate-y-1" : "border-gray-100 shadow-sm"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {vehicle.badge && <Badge text={vehicle.badge} />}

      {/* Image zone avec image locale */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        {!imageError ? (
          <img 
            src={vehicle.image} 
            alt={vehicle.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${hovered ? "scale-110" : "scale-100"}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <Car size={48} className="text-gray-400" />
          </div>
        )}
        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`} />
      </div>

      {/* Contenu */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-red-500 font-semibold mb-0.5">{vehicle.category}</p>
            <h3 className="text-base font-bold text-gray-900">{vehicle.name}</h3>
          </div>
          <Stars rating={vehicle.rating} />
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 my-3 py-3 border-y border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users size={12} className="text-gray-400" /> {vehicle.seats} places
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Settings size={12} className="text-gray-400" /> {vehicle.transmission}
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Fuel size={12} className="text-gray-400" /> {vehicle.fuel}
          </div>
        </div>

        {/* Prix + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-black text-gray-900">${vehicle.price}</span>
            <span className="text-xs text-gray-400 font-medium"> /jour</span>
          </div>
          <Link
            to="/reservation"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300
              ${hovered
                ? "bg-red-600 text-white shadow-lg shadow-red-200"
                : "bg-red-50 text-red-600"
              }`}
          >
            Réserver <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── TestimonialCard ──────────────────────────────────────────────────────────
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Quote size={28} className="text-red-100 fill-red-100" />
        <Stars rating={testimonial.rating} />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">
        "{testimonial.comment}"
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
        <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{testimonial.name}</p>
          <p className="text-xs text-gray-400">{testimonial.role} · {testimonial.date}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale HomePage ─────────────────────────────────────────────────
function HomePage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [searchDate1, setSearchDate1] = useState("");
  const [searchDate2, setSearchDate2] = useState("");
  const [heroImageError, setHeroImageError] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const categories = ["Tous", "SUV", "Berline", "Pick-up"];

  const filteredVehicles = activeCategory === "Tous"
    ? VEHICLES
    : VEHICLES.filter((v) => v.category === activeCategory);

  const visibleTestimonials = [
    TESTIMONIALS[testimonialIdx % TESTIMONIALS.length],
    TESTIMONIALS[(testimonialIdx + 1) % TESTIMONIALS.length],
    TESTIMONIALS[(testimonialIdx + 2) % TESTIMONIALS.length],
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ═══════════════════════════════════════════════════
          HERO SECTION AVEC BANNIÈRE BACKGROUND
      ═══════════════════════════════════════════════════ */}
      <section
        id="accueil"
        ref={heroRef}
        className="relative min-h-[92vh] flex items-center overflow-hidden bg-gray-900"
      >
        {/* Image de fond principale - BANNIÈRE (sans dégradé) */}
        {!heroImageError ? (
          <img 
            src="/images/hero-banner.jpg" 
            alt="K-JOU RENT A CAR"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setHeroImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800" />
        )}
        
        {/* Overlay noir simple (sans dégradé) */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center z-10">

          {/* Texte gauche */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600/80 text-red-100 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse" />
              Cap-Haïtien, Haïti · Depuis 2022
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight">
              Louez le{" "}
              <span className="text-red-500">véhicule</span>{" "}
              parfait pour vos trajets
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed max-w-lg">
              K-JOU RENT A CAR vous propose une flotte de véhicules modernes, bien entretenus et disponibles 24h/24 à Cap-Haïtien et environs.
            </p>

            {/* Barre de recherche rapide */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-1">Départ</label>
                <input
                  type="date"
                  value={searchDate1}
                  onChange={(e) => setSearchDate1(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold px-1">Retour</label>
                <input
                  type="date"
                  value={searchDate2}
                  onChange={(e) => setSearchDate2(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
              <div className="flex items-end">
                <Link
                  to="/reservation"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all shadow-lg whitespace-nowrap"
                >
                  Voir les voitures <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Mini stats */}
            <div className="flex items-center gap-6 pt-2">
              {[
                { val: "500+", label: "Clients" },
                { val: "50+",  label: "Véhicules" },
                { val: "4.9★", label: "Note moyenne" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-black text-white">{s.val}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Droite : carte véhicule hero avec image locale */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* Carte principale */}
            <div className="bg-white/10 border border-white/20 rounded-3xl overflow-hidden">
              <div className="h-48 overflow-hidden bg-gray-700">
                <img 
                  src="/images/toyota-rav4.jpg" 
                  alt="Toyota RAV4 2024"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="text-gray-400" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15 7H9L12 2Z"/><path d="M4 7L8 12L4 17H2V7H4Z"/><path d="M20 7H22V17H20L16 12L20 7Z"/><path d="M9 17H15L12 22L9 17Z"/></svg></div>`;
                    }
                  }}
                />
              </div>
              <div className="p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Véhicule du moment</p>
                    <p className="text-xl font-black mt-0.5">Toyota RAV4 2024</p>
                    <Stars rating={4.9} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-red-400">$85</p>
                    <p className="text-xs text-gray-400">/jour</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                  <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">5 places</span>
                  <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">Automatique</span>
                  <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">Essence</span>
                </div>
              </div>
            </div>

            {/* Bouton play vidéo */}
            <button
              onClick={() => setShowVideo(true)}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-sm font-medium transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Play size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold">Voir notre présentation</p>
                <p className="text-xs text-gray-400">Découvrez K-JOU RENT A CAR</p>
              </div>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400 z-10">
          <span className="text-[10px] uppercase tracking-widest">Défiler</span>
          <div className="w-px h-8 bg-gray-400 animate-pulse" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS SECTION
      ═══════════════════════════════════════════════════ */}
      <section className="bg-red-600 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center flex flex-col items-center gap-2">
                <div className="text-white/70">{stat.icon}</div>
                <p className="text-4xl font-black text-white">{stat.value}</p>
                <p className="text-sm text-red-200 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          À PROPOS SECTION
      ═══════════════════════════════════════════════════ */}
      <section id="apropos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Texte */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-red-600 font-bold mb-3">À propos de nous</p>
                <h2 className="text-4xl font-black text-gray-900 leading-tight">
                  La référence de la location de voitures à{" "}
                  <span className="text-red-600">Cap-Haïtien</span>
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Fondée en 2022 et située Route Nationale #1, Vaudreuil, Carrefour Zabitan à Cap-Haïtien, K-JOU RENT A CAR s'est imposée comme la référence de la location de véhicules dans le nord d'Haïti. Notre mission est simple : vous offrir un service fiable, sécurisé et adapté à vos besoins, que vous soyez un particulier ou une entreprise.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Notre flotte de véhicules diversifiée et constamment entretenue vous garantit confort et sécurité lors de chacun de vos déplacements. Du SUV robuste au pick-up tout-terrain, nous avons le véhicule qu'il vous faut.
              </p>
              {/* Points forts */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Véhicules récents et entretenus",
                  "Réservation en ligne 24/7",
                  "Contrat transparent et clair",
                  "Assistance clientèle dédiée",
                  "Prix compétitifs et flexibles",
                  "Livraison sur demande",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-red-600" />
                    </div>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm hover:gap-3 transition-all"
              >
                Nous contacter <ArrowRight size={16} />
              </Link>
            </div>

            {/* Visuel avec image locale */}
            <div className="relative">
              <div className="aspect-square bg-red-700 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl">
                <img 
                  src="/images/agence.jpg" 
                  alt="K-JOU RENT A CAR Agence"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-red-700"><span class="text-white text-6xl">🏢</span></div>`;
                    }
                  }}
                />
                {/* Overlay infos */}
                <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">K-JOU RENT A CAR</p>
                      <p className="text-xs text-gray-500">Route Nationale #1, Vaudreuil, Cap-Haïtien</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Badge flottant */}
              <div className="absolute -top-4 -right-4 bg-red-600 text-white rounded-2xl px-4 py-3 shadow-xl">
                <p className="text-2xl font-black">4★</p>
                <p className="text-[10px] text-red-200 uppercase tracking-wider">Années</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CATALOGUE VÉHICULES
      ═══════════════════════════════════════════════════ */}
      <section id="voitures" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-red-600 font-bold mb-2">Notre flotte</p>
              <h2 className="text-4xl font-black text-gray-900">Nos véhicules disponibles</h2>
            </div>
            <Link
              to="/reservation"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-all whitespace-nowrap"
            >
              Voir tous <ChevronRight size={16} />
            </Link>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border
                  ${activeCategory === cat
                    ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grille véhicules */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          COMMENT ÇA MARCHE
      ═══════════════════════════════════════════════════ */}
      <section id="comment" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-red-500 font-bold mb-3">Simple & rapide</p>
            <h2 className="text-4xl font-black">Comment ça marche ?</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto text-sm">
              Réservez votre véhicule en 3 étapes simples et prenez la route en toute sérénité.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Ligne de connexion */}
            <div className="hidden md:block absolute top-10 left-[25%] right-[25%] h-px bg-red-600" />

            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-400">
                    {step.icon}
                  </div>
                  <span className="absolute -top-3 -right-3 text-xs font-black text-red-500 bg-gray-900 px-1">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/reservation"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg"
            >
              Réserver maintenant <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          AVANTAGES
      ═══════════════════════════════════════════════════ */}
      <section id="avantages" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-red-600 font-bold mb-3">Pourquoi nous choisir</p>
            <h2 className="text-4xl font-black text-gray-900">Nos avantages</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield size={28} />,   title: "Sécurité garantie",      desc: "Tous nos véhicules sont assurés et régulièrement contrôlés pour votre sécurité.", color: "red"   },
              { icon: <Clock size={28} />,    title: "Disponible 24h/24",      desc: "Notre équipe est joignable à toute heure pour répondre à vos besoins urgents.",   color: "blue"  },
              { icon: <Star size={28} />,     title: "Service premium",        desc: "Un accueil personnalisé et un service client attentif à chaque étape de votre location.", color: "amber" },
              { icon: <Car size={28} />,      title: "Flotte diversifiée",     desc: "SUV, berlines, pick-ups : une large sélection de véhicules pour tous vos besoins.", color: "green" },
            ].map((item) => {
              const colors: Record<string, { bg: string; icon: string; border: string }> = {
                red:   { bg: "bg-red-50",   icon: "text-red-600",   border: "border-red-100"   },
                blue:  { bg: "bg-blue-50",  icon: "text-blue-600",  border: "border-blue-100"  },
                amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
                green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
              };
              const c = colors[item.color];
              return (
                <div key={item.title} className={`${c.bg} border ${c.border} rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300`}>
                  <div className={c.icon}>{item.icon}</div>
                  <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TÉMOIGNAGES
      ═══════════════════════════════════════════════════ */}
      <section id="temoignages" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-red-600 font-bold mb-2">Avis clients</p>
              <h2 className="text-4xl font-black text-gray-900">Ce que disent nos clients</h2>
            </div>
            {/* Contrôles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {visibleTestimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className={`rounded-full transition-all duration-300 ${testimonialIdx % TESTIMONIALS.length === i ? "w-6 h-2 bg-red-600" : "w-2 h-2 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Prêt à prendre la route ?
          </h2>
          <p className="text-red-100 mb-8 text-lg max-w-xl mx-auto">
            Réservez dès maintenant votre véhicule en ligne et bénéficiez de nos meilleurs tarifs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/reservation"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-red-600 font-bold text-sm hover:bg-red-50 transition-all shadow-xl hover:shadow-2xl"
            >
              <Car size={18} /> Réserver maintenant
            </Link>
            <a
              href="tel:+50912345678"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              <Phone size={18} /> Nous appeler
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CONTACT RAPIDE
      ═══════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <MapPin size={22} className="text-red-600" />, title: "Notre adresse",   value: "Route Nationale #1, Vaudreuil, Carrefour Zabitan, Cap-Haïtien" },
              { icon: <Phone size={22} className="text-red-600" />,  title: "Téléphone",       value: "+509 XXXX XXXX · Disponible 24h/24"                           },
              { icon: <Mail size={22} className="text-red-600" />,   title: "Email",           value: "contact@kjourentacar.ht"                                      },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">{item.title}</p>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Réseaux sociaux */}
          <div className="flex items-center justify-center gap-4 mt-10 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Suivez-nous</p>
            {[
              {
                label: "Facebook",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                )
              },
              {
                label: "Instagram",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                )
              },
              {
                label: "WhatsApp",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                )
              },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                {s.svg}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          MODAL VIDÉO
      ═══════════════════════════════════════════════════ */}
      {showVideo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black transition-colors"
            >
              <X size={16} />
            </button>
            <div className="aspect-video bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <Play size={64} className="mx-auto mb-4 text-red-500" />
                <p className="text-lg font-semibold">Présentation K-JOU RENT A CAR</p>
                <p className="text-sm text-gray-400 mt-1">Vidéo à intégrer ici</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
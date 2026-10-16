import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Fuel,
  Zap,
  Users,
  Gauge,
  Settings2,
  Snowflake,
  CarFront,
  Heart,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Shield,
  Phone,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Wrench,
  Tag,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import vehicleService, {
  type Vehicle,
} from "../../api/services/vehicleService";

/* ============================================================
   HELPERS
============================================================ */

function getAllImageUrls(vehicle: Vehicle): string[] {
  if (!vehicle.images || vehicle.images.length === 0) {
    return [];
  }

  return vehicle.images
    .slice()
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;

      return a.display_order - b.display_order;
    })
    .map((img) => img.image_url || img.image)
    .filter(Boolean) as string[];
}

function formatPrice(value: string): string {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(number);
}

function getCategoryLabel(vehicle: Vehicle): string {
  return vehicle.category_display || vehicle.category;
}

function getTransmissionLabel(vehicle: Vehicle): string {
  return vehicle.transmission_display || vehicle.transmission;
}

function getFuelLabel(vehicle: Vehicle): string {
  return vehicle.fuel_type_display || vehicle.fuel_type;
}

function getConditionLabel(vehicle: Vehicle): string {
  return vehicle.condition_display || vehicle.condition;
}

function getStatusLabel(vehicle: Vehicle): string {
  if (vehicle.status_display) {
    return vehicle.status_display;
  }

  switch (vehicle.status) {
    case "AVAILABLE":
      return "Disponible";

    case "MAINTENANCE":
      return "En entretien";

    case "OUT_OF_SERVICE":
      return "Hors service";

    default:
      return vehicle.status;
  }
}

function isVehicleAvailable(vehicle: Vehicle): boolean {
  return vehicle.status === "AVAILABLE";
}

function getFuelIcon(fuelType: string) {
  return fuelType === "ELECTRIC" ? (
    <Zap size={16} />
  ) : (
    <Fuel size={16} />
  );
}

function getConditionColor(condition: string) {
  switch (condition) {
    case "EXCELLENT":
      return "bg-green-50 text-green-700";

    case "GOOD":
      return "bg-blue-50 text-blue-700";

    case "FAIR":
      return "bg-amber-50 text-amber-700";

    case "POOR":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-50 text-slate-600";
  }
}

/* ============================================================
   GALERIE PHOTOS
============================================================ */

function ImageGallery({ vehicle }: { vehicle: Vehicle }) {
  const images = getAllImageUrls(vehicle);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-2xl bg-slate-100 lg:h-[460px]">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <CarFront size={64} strokeWidth={1} />

          <p className="text-sm font-medium">
            Aucune photo disponible
          </p>
        </div>
      </div>
    );
  }

  const prev = () => {
    setActiveIndex((index) =>
      index === 0 ? images.length - 1 : index - 1
    );
  };

  const next = () => {
    setActiveIndex((index) =>
      index === images.length - 1 ? 0 : index + 1
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* IMAGE PRINCIPALE */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-100">
        <img
          src={images[activeIndex]}
          alt={`${vehicle.brand} ${vehicle.model} — photo ${
            activeIndex + 1
          }`}
          className="h-80 w-full object-cover lg:h-[460px]"
        />

        {images.length > 1 && (
          <>
            {/* PHOTO PRECEDENTE */}
            <button
              type="button"
              onClick={prev}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>

            {/* PHOTO SUIVANTE */}
            <button
              type="button"
              onClick={next}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>

            {/* COMPTEUR */}
            <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* MINIATURES */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              className={[
                "h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                index === activeIndex
                  ? "border-red-500 opacity-100"
                  : "border-transparent opacity-60 hover:opacity-80",
              ].join(" ")}
            >
              <img
                src={url}
                alt={`Miniature ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   BADGE DISPONIBILITÉ
============================================================ */

function AvailabilityBadge({
  vehicle,
}: {
  vehicle: Vehicle;
}) {
  const available = isVehicleAvailable(vehicle);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        available
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          available ? "bg-green-500" : "bg-red-600",
        ].join(" ")}
      />

      {getStatusLabel(vehicle)}
    </span>
  );
}

/* ============================================================
   LIGNE SPECIFICATION
============================================================ */

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="text-slate-400">
          {icon}
        </span>

        {label}
      </div>

      <span className="text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   PAGE DETAIL VEHICULE
============================================================ */

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  /* ==========================================================
     CHARGEMENT DU VEHICULE
  ========================================================== */
    // APRÈS — cas !id géré en dehors de l'effet
useEffect(() => {
  if (!id) return;

  let mounted = true;

  const loadVehicle = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await vehicleService.getVehicle(id);

      if (mounted) setVehicle(data);
    } catch (err) {
      console.error("[VehicleDetailPage] Erreur chargement:", err);
      if (mounted) setError("Impossible de charger ce véhicule pour le moment.");
    } finally {
      if (mounted) setLoading(false);
    }
  };

  loadVehicle();

  return () => { mounted = false; };
}, [id]);

// Cas !id géré au niveau du rendu — avant les états loading/error
if (!id) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Véhicule introuvable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Identifiant du véhicule manquant.
          </p>
          <button
            type="button"
            onClick={() => navigate("/vehicles")}
            className="mt-6 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retour à la flotte
          </button>
        </div>
      </div>
    </div>
  );
}
  /* ==========================================================
     ERREUR
  ========================================================== */

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle
                size={28}
                className="text-red-600"
              />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Véhicule introuvable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error ||
                "Ce véhicule n'existe pas ou a été retiré de la flotte."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/vehicles")}
              className="mt-6 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Retour à la flotte
            </button>
          </div>
        </div>
      </div>
    );
  }

  const available = isVehicleAvailable(vehicle);

  /* ==========================================================
     RESERVATION
     
     IMPORTANT :
     Le contrôle du profil ne se fait PAS ici.
     Il sera effectué dans le processus de réservation
     et surtout côté backend.
  ========================================================== */

  const handleReserve = () => {
    if (!vehicle || !available) {
      return;
    }

    navigate("/reservation", {
      state: {
        vehicleId: vehicle.id,
        vehicle,
        from: `/vehicles/${vehicle.id}`,
      },
    });
  };

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* LOGO */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <CarFront size={21} />
            </div>

            <div className="text-left">
              <p className="text-base font-extrabold tracking-tight text-slate-900">
                Kjou
                <span className="text-red-600">
                  RentACar
                </span>
              </p>

              <p className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:block">
                Location automobile
              </p>
            </div>
          </button>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Accueil
            </button>

            <button
              type="button"
              onClick={() => navigate("/vehicles")}
              className="text-sm font-semibold text-red-600"
            >
              Véhicules
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Services
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              À propos
            </button>

            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Contact
            </button>
          </nav>

          {/* CONNEXION */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:text-red-600"
          >
            Connexion
          </button>
        </div>
      </header>

      {/* ======================================================
          BREADCRUMB
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate("/vehicles")}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
          >
            <ArrowLeft size={15} />
            Retour à la flotte
          </button>
        </div>
      </div>

      {/* ======================================================
          CONTENU PRINCIPAL
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ==================================================
              COLONNE GAUCHE
          ================================================== */}

          <div className="flex flex-col gap-6">
            {/* GALERIE */}
            <ImageGallery vehicle={vehicle} />

            {/* DESCRIPTION */}
            {vehicle.description && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Info
                    size={17}
                    className="text-red-600"
                  />
                  À propos de ce véhicule
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* SPECIFICATIONS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Settings2
                  size={17}
                  className="text-red-600"
                />
                Caractéristiques techniques
              </h2>

              <div className="mt-4">
                <SpecRow
                  icon={getFuelIcon(vehicle.fuel_type)}
                  label="Carburant"
                  value={getFuelLabel(vehicle)}
                />

                <SpecRow
                  icon={<Settings2 size={16} />}
                  label="Transmission"
                  value={getTransmissionLabel(vehicle)}
                />

                <SpecRow
                  icon={<Users size={16} />}
                  label="Nombre de places"
                  value={`${vehicle.seats} places`}
                />

                <SpecRow
                  icon={<CarFront size={16} />}
                  label="Nombre de portes"
                  value={`${vehicle.doors} portes`}
                />

                <SpecRow
                  icon={<Gauge size={16} />}
                  label="Kilométrage"
                  value={
                    vehicle.unlimited_mileage
                      ? "Kilométrage illimité"
                      : `${vehicle.mileage.toLocaleString(
                          "fr-FR"
                        )} km`
                  }
                />

                <SpecRow
                  icon={<Tag size={16} />}
                  label="Catégorie"
                  value={getCategoryLabel(vehicle)}
                />

                <SpecRow
                  icon={<Star size={16} />}
                  label="État général"
                  value={getConditionLabel(vehicle)}
                />

                {vehicle.color && (
                  <SpecRow
                    icon={
                      <div className="h-4 w-4 rounded-full border border-slate-200 bg-slate-300" />
                    }
                    label="Couleur"
                    value={vehicle.color}
                  />
                )}
              </div>
            </div>

            {/* EQUIPEMENTS */}
            {vehicle.vehicle_equipments &&
              vehicle.vehicle_equipments.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <CheckCircle2
                      size={17}
                      className="text-red-600"
                    />
                    Équipements inclus
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {vehicle.vehicle_equipments.map(
                      (equipment) => (
                        <div
                          key={equipment.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                        >
                          <CheckCircle2
                            size={14}
                            className="shrink-0 text-green-500"
                          />

                          {equipment.equipment_name}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* OPTIONS */}
            {vehicle.air_conditioning && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Snowflake
                    size={17}
                    className="text-red-600"
                  />
                  Options & confort
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                    <Snowflake size={14} />
                    Climatisation
                  </span>
                </div>
              </div>
            )}

            {/* MAINTENANCE */}
            {(vehicle.last_maintenance_date ||
              vehicle.next_maintenance_date) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Wrench
                    size={17}
                    className="text-red-600"
                  />
                  Entretien
                </h2>

                <div className="mt-4 space-y-3">
                  {vehicle.last_maintenance_date && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <Clock size={14} />
                        Dernier entretien
                      </span>

                      <span className="text-right font-semibold text-slate-800">
                        {new Date(
                          vehicle.last_maintenance_date
                        ).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {vehicle.next_maintenance_date && (
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex items-center gap-2 text-slate-500">
                        <CalendarDays size={14} />
                        Prochain entretien
                      </span>

                      <span className="text-right font-semibold text-slate-800">
                        {new Date(
                          vehicle.next_maintenance_date
                        ).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================================================
              COLONNE DROITE
          ================================================== */}

          <div>
            <div className="sticky top-6 flex flex-col gap-4">
              {/* CARD PRINCIPALE */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* EN-TETE */}
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2">
                        <AvailabilityBadge vehicle={vehicle} />
                      </div>

                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {vehicle.brand} {vehicle.model}
                      </h1>

                      <p className="mt-1 text-sm text-slate-500">
                        {vehicle.year}
                        {vehicle.color
                          ? ` • ${vehicle.color}`
                          : ""}
                        {" • "}
                        {getCategoryLabel(vehicle)}
                      </p>
                    </div>

                    {/* FAVORI */}
                    <button
                      type="button"
                      aria-label={
                        favorite
                          ? "Retirer des favoris"
                          : "Ajouter aux favoris"
                      }
                      onClick={() =>
                        setFavorite((value) => !value)
                      }
                      className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                        favorite
                          ? "border-red-200 bg-red-50 text-red-600"
                          : "border-slate-200 bg-white text-slate-400 hover:text-red-600",
                      ].join(" ")}
                    >
                      <Heart
                        size={18}
                        fill={
                          favorite
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>
                </div>

                {/* TARIFS */}
                <div className="border-b border-slate-100 p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tarifs
                  </p>

                  <div className="space-y-2">
                    {/* JOUR */}
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-slate-600">
                        Par jour
                      </span>

                      <div className="text-right">
                        <span className="text-3xl font-extrabold text-red-600">
                          {formatPrice(
                            vehicle.daily_rate
                          )}
                        </span>

                        <span className="ml-1 text-sm text-slate-400">
                          HTG
                        </span>
                      </div>
                    </div>

                    {/* SEMAINE */}
                    {vehicle.weekly_rate && (
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-sm text-slate-500">
                          Par semaine
                        </span>

                        <span className="text-sm font-bold text-slate-800">
                          {formatPrice(
                            vehicle.weekly_rate
                          )}{" "}
                          <span className="font-normal text-slate-400">
                            HTG
                          </span>
                        </span>
                      </div>
                    )}

                    {/* MOIS */}
                    {vehicle.monthly_rate && (
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-sm text-slate-500">
                          Par mois
                        </span>

                        <span className="text-sm font-bold text-slate-800">
                          {formatPrice(
                            vehicle.monthly_rate
                          )}{" "}
                          <span className="font-normal text-slate-400">
                            HTG
                          </span>
                        </span>
                      </div>
                    )}

                    {/* CAUTION */}
                    {vehicle.deposit && (
                      <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                        <span className="flex items-center gap-1.5 text-sm text-amber-700">
                          <Shield size={13} />
                          Caution
                        </span>

                        <span className="text-sm font-bold text-amber-800">
                          {formatPrice(vehicle.deposit)}{" "}
                          <span className="font-normal text-amber-600">
                            HTG
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SPECS RAPIDES */}
                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {getFuelIcon(vehicle.fuel_type)}

                    <span className="truncate">
                      {getFuelLabel(vehicle)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Settings2
                      size={15}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="truncate">
                      {getTransmissionLabel(vehicle)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users
                      size={15}
                      className="shrink-0 text-slate-400"
                    />

                    <span>
                      {vehicle.seats} places
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Gauge
                      size={15}
                      className="shrink-0 text-slate-400"
                    />

                    <span>
                      {vehicle.unlimited_mileage
                        ? "Km illimités"
                        : `${vehicle.mileage.toLocaleString(
                            "fr-FR"
                          )} km`}
                    </span>
                  </div>
                </div>

                {/* ETAT */}
                <div className="border-b border-slate-100 px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">
                      État général
                    </span>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        getConditionColor(
                          vehicle.condition
                        ),
                      ].join(" ")}
                    >
                      {getConditionLabel(vehicle)}
                    </span>
                  </div>
                </div>

                {/* CTA RESERVATION */}
                <div className="p-5">
                  <button
                    type="button"
                    disabled={!available}
                    onClick={handleReserve}
                    className={[
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-colors",
                      available
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "cursor-not-allowed bg-slate-100 text-slate-400",
                    ].join(" ")}
                  >
                    <CalendarDays size={17} />

                    {available
                      ? "Réserver ce véhicule"
                      : "Véhicule indisponible"}
                  </button>

                  {!available && (
                    <p className="mt-2 text-center text-xs text-slate-400">
                      Ce véhicule n'est pas disponible à
                      la location pour le moment.
                    </p>
                  )}
                </div>
              </div>

              {/* CARD CONTACT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Phone
                    size={15}
                    className="text-red-600"
                  />
                  Besoin d'aide ?
                </h3>

                <p className="text-xs leading-5 text-slate-500">
                  Notre équipe est disponible pour répondre
                  à vos questions sur ce véhicule ou vous aider
                  dans votre réservation.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/contact")}
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:text-red-600"
                >
                  Nous contacter
                </button>
              </div>

              {/* CARD INFORMATION */}
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="mt-0.5 shrink-0 text-red-600">
                  <CheckCircle2 size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Réservation simple et rapide
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-800/70">
                    Indiquez vos dates et finalisez votre
                    réservation en quelques minutes. Votre
                    profil sera vérifié à l'étape suivante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
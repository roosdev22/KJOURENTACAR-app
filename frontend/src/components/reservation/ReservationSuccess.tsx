import AdminIcon, { type AdminIconName } from "../admin/AdminIcon";
import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

interface ReservationSuccessProps {
  reservation: Reservation;
  onNewReservation: () => void;
}

/* ============================================================
   FORMATAGE
============================================================ */

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value: string | null): string {
  if (value === null || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ============================================================
   CONFIGURATION DU STATUT
============================================================ */

interface StatusConfig {
  icon: AdminIconName;
  label: string;
  heroLabel: string;
  title: string;
  description: string;
  badgeClassName: string;
  iconClassName: string;
  heroBackgroundClassName: string;
  accentClassName: string;
}

function getStatusConfig(
  status: ReservationStatus
): StatusConfig {
  switch (status) {
    case "PENDING_VERIFICATION":
      return {
        icon: "clock",
        label: "En attente de vérification",
        heroLabel: "Demande envoyée",
        title: "Votre demande a bien été enregistrée",
        description:
          "Votre demande de réservation a été enregistrée avec succès. Elle doit maintenant être vérifiée par notre équipe.",
        badgeClassName:
          "border-[#F0D8B4] bg-[#FFF8EC] text-[#9A5A00]",
        iconClassName: "text-[#9A5A00]",
        heroBackgroundClassName:
          "border-[#F0D8B4] bg-[#FFF8EC]",
        accentClassName: "bg-[#D99000]",
      };

    case "CONFIRMED":
      return {
        icon: "check-circle",
        label: "Réservation confirmée",
        heroLabel: "Réservation confirmée",
        title: "Votre réservation est confirmée",
        description:
          "Votre réservation a été vérifiée et confirmée par notre équipe.",
        badgeClassName:
          "border-[#CBE8D4] bg-[#F1FBF4] text-[#188A3B]",
        iconClassName: "text-[#188A3B]",
        heroBackgroundClassName:
          "border-[#CBE8D4] bg-[#F1FBF4]",
        accentClassName: "bg-[#188A3B]",
      };

    case "CANCELLED":
      return {
        icon: "x-circle",
        label: "Réservation annulée",
        heroLabel: "Réservation annulée",
        title: "Votre réservation a été annulée",
        description:
          "Cette réservation a été annulée. Consultez les informations d'annulation ci-dessous.",
        badgeClassName:
          "border-[#F1C7C7] bg-[#FFF4F4] text-[#B42318]",
        iconClassName: "text-[#B42318]",
        heroBackgroundClassName:
          "border-[#F1C7C7] bg-[#FFF4F4]",
        accentClassName: "bg-[#B42318]",
      };

    case "EN_COURS":
      return {
        icon: "car-front",
        label: "Location en cours",
        heroLabel: "Location en cours",
        title: "Votre location est en cours",
        description:
          "Votre réservation est actuellement en cours d'utilisation.",
        badgeClassName:
          "border-[#D5E3FA] bg-[#F1F6FF] text-[#2457A6]",
        iconClassName: "text-[#2457A6]",
        heroBackgroundClassName:
          "border-[#D5E3FA] bg-[#F1F6FF]",
        accentClassName: "bg-[#2457A6]",
      };

    case "TERMINEE":
      return {
        icon: "check-circle",
        label: "Location terminée",
        heroLabel: "Location terminée",
        title: "Votre location est terminée",
        description:
          "Cette réservation est maintenant terminée.",
        badgeClassName:
          "border-[#E2E2E2] bg-[#F6F6F6] text-[#555555]",
        iconClassName: "text-[#555555]",
        heroBackgroundClassName:
          "border-[#E2E2E2] bg-[#F6F6F6]",
        accentClassName: "bg-[#555555]",
      };

    default:
      return {
        icon: "info",
        label: "Statut inconnu",
        heroLabel: "Réservation",
        title: "Réservation enregistrée",
        description:
          "Votre réservation a été enregistrée.",
        badgeClassName:
          "border-[#E2E2E2] bg-[#F6F6F6] text-[#555555]",
        iconClassName: "text-[#555555]",
        heroBackgroundClassName:
          "border-[#E2E2E2] bg-[#F6F6F6]",
        accentClassName: "bg-[#555555]",
      };
  }
}

/* ============================================================
   PETITS COMPOSANTS UI
============================================================ */

function SectionHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: AdminIconName;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F1]">
        <AdminIcon
          name={icon}
          size={19}
          strokeWidth={2}
          className="text-[#CC0000]"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#A0A0A0]">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-base font-black tracking-tight text-[#111111] sm:text-lg">
          {title}
        </h2>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4 transition-colors",
        accent
          ? "border-[#F3D0D0] bg-[#FFF8F8]"
          : "border-[#ECECEC] bg-[#F8F8F8]",
      ].join(" ")}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#999999]">
        {label}
      </p>

      <p
        className={[
          "mt-2 text-sm font-black leading-5",
          accent ? "text-[#CC0000]" : "text-[#111111]",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   COMPOSANT
============================================================ */

export default function ReservationSuccess({
  reservation,
  onNewReservation,
}: ReservationSuccessProps) {
  const statusConfig = getStatusConfig(
    reservation.statut
  );

  const isPending =
    reservation.statut === "PENDING_VERIFICATION";

  const isConfirmed =
    reservation.statut === "CONFIRMED";

  const isCancelled =
    reservation.statut === "CANCELLED";

  const hasCancellationReason =
    Boolean(reservation.motif_annulation?.trim());

  const hasClientNotes =
    Boolean(reservation.notes_client?.trim());

  const vehicleCount =
    reservation.lignes.length;

  return (
    <main className="min-h-screen bg-[#F5F5F5] text-[#111111]">
      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden border-b border-[#E7E7E7] bg-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#CC0000]" />

        <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-11 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Status icon */}

            <div
              className={[
                "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm sm:h-[72px] sm:w-[72px]",
                statusConfig.heroBackgroundClassName,
              ].join(" ")}
              aria-hidden="true"
            >
              <AdminIcon
                name={statusConfig.icon}
                size={32}
                strokeWidth={1.9}
                className={statusConfig.iconClassName}
              />
            </div>

            {/* Eyebrow */}

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#E7E7E7] bg-[#FAFAFA] px-3 py-1.5">
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  statusConfig.accentClassName,
                ].join(" ")}
              />

              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#777777]">
                {statusConfig.heroLabel}
              </span>
            </div>

            {/* Title */}

            <h1 className="mx-auto mt-4 max-w-3xl text-2xl font-black tracking-[-0.035em] text-[#111111] sm:text-3xl lg:text-[2.65rem] lg:leading-[1.1]">
              {statusConfig.title}
            </h1>

            {/* Description */}

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#707070]">
              {statusConfig.description}
            </p>

            {/* Reservation number */}

            <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-xl bg-[#111111] px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <AdminIcon name="clipboard-check" size={16} className="shrink-0 text-white" />

              <span className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
                {reservation.numero}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          CONTENU
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          {/* ==================================================
              COLONNE PRINCIPALE
          ================================================== */}

          <div className="min-w-0 space-y-5">
            {/* ==================================================
                STATUT
            ================================================== */}

            <section
              className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_3px_18px_rgba(0,0,0,0.025)]"
              aria-labelledby="reservation-status-title"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                      statusConfig.badgeClassName,
                    ].join(" ")}
                  >
                    <AdminIcon name={statusConfig.icon} size={21} strokeWidth={2} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#999999]">
                      État de la réservation
                    </p>

                    <h2
                      id="reservation-status-title"
                      className="mt-1 text-base font-black tracking-tight text-[#111111] sm:text-lg"
                    >
                      {reservation.statut_display ||
                        statusConfig.label}
                    </h2>

                    <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#707070] sm:text-sm">
                      {statusConfig.description}
                    </p>
                  </div>
                </div>

                {/* Pending */}

                {isPending && (
                  <div className="mt-5 rounded-xl border border-[#F0D8B4] bg-[#FFF9F0] p-4">
                    <div className="flex items-start gap-3">
                      <AdminIcon name="clock" size={17} className="mt-0.5 shrink-0 text-[#9A5A00]" />

                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#76531E]">
                          Vérification en cours
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#76531E]">
                          Notre équipe doit vérifier les
                          informations de votre demande
                          avant sa confirmation.
                        </p>

                        <div className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-wide text-[#76531E]">
                            {reservation.numero}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirmed */}

                {isConfirmed && (
                  <div className="mt-5 rounded-xl border border-[#CBE8D4] bg-[#F3FBF5] p-4">
                    <div className="flex items-start gap-3">
                      <AdminIcon name="check-circle" size={17} className="mt-0.5 shrink-0 text-[#188A3B]" />

                      <div>
                        <p className="text-xs font-black text-[#28663A]">
                          Réservation confirmée
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#28663A]">
                          Votre réservation a été validée
                          par notre équipe. Conservez votre
                          numéro de réservation pour vos
                          prochaines communications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancelled */}

                {isCancelled && (
                  <div className="mt-5 rounded-xl border border-[#F1C7C7] bg-[#FFF5F5] p-4">
                    <div className="flex items-start gap-3">
                      <AdminIcon name="x-circle" size={17} className="mt-0.5 shrink-0 text-[#B42318]" />

                      <div>
                        <p className="text-xs font-black text-[#8A2C25]">
                          Réservation annulée
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#8A2C25]">
                          Cette réservation n'est plus
                          active.
                        </p>
                      </div>
                    </div>

                    {hasCancellationReason && (
                      <div className="mt-4 border-t border-[#F1C7C7] pt-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#A35A54]">
                          Motif d'annulation
                        </p>

                        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-[#7F2A24]">
                          {reservation.motif_annulation}
                        </p>
                      </div>
                    )}

                    {reservation.date_annulation && (
                      <div className="mt-4 border-t border-[#F1C7C7] pt-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#A35A54]">
                          Date d'annulation
                        </p>

                        <p className="mt-1.5 text-xs font-black text-[#7F2A24]">
                          {formatDateTime(
                            reservation.date_annulation
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className={[
                  "h-0.5 w-full",
                  statusConfig.accentClassName,
                ].join(" ")}
                aria-hidden="true"
              />
            </section>

            {/* ==================================================
                PÉRIODE
            ================================================== */}

            <section
              className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_3px_18px_rgba(0,0,0,0.025)] sm:p-6"
              aria-labelledby="reservation-period-title"
            >
              <SectionHeader
                icon="calendar-check"
                eyebrow="Planning"
                title="Période de location"
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoCard
                  label="Date de début"
                  value={formatDate(
                    reservation.date_debut
                  )}
                />

                <InfoCard
                  label="Date de fin"
                  value={formatDate(
                    reservation.date_fin
                  )}
                />

                <InfoCard
                  label="Durée"
                  value={`${reservation.nombre_jours} jour${
                    reservation.nombre_jours > 1
                      ? "s"
                      : ""
                  }`}
                  accent
                />
              </div>
            </section>

            {/* ==================================================
                VÉHICULES
            ================================================== */}

            <section
              className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_3px_18px_rgba(0,0,0,0.025)] sm:p-6"
              aria-labelledby="reservation-vehicles-title"
            >
              <div className="flex items-center justify-between gap-4">
                <SectionHeader
                  icon="car-front"
                  eyebrow="Sélection"
                  title="Véhicules réservés"
                />

                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#111111] px-2.5 text-[10px] font-black text-white">
                  {vehicleCount}
                </span>
              </div>

              {vehicleCount === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-[#DDDDDD] bg-[#FAFAFA] p-6 text-center">
                  <AdminIcon name="car-front" size={24} className="mx-auto text-[#BBBBBB]" />

                  <p className="mt-2 text-xs text-[#777777]">
                    Aucun véhicule associé à cette
                    réservation.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {reservation.lignes.map(
                    (ligne) => (
                      <article
                        key={ligne.id}
                        className="overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#FCFCFC] transition-colors hover:border-[#DADADA]"
                      >
                        <div className="p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111111]">
                                  <AdminIcon name="car-front" size={15} className="text-white" />
                                </div>

                                <h3 className="truncate text-sm font-black text-[#111111]">
                                  {ligne.vehicule.brand}{" "}
                                  {ligne.vehicule.model}
                                </h3>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-lg bg-white px-3 py-2.5">
                                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#A0A0A0]">
                                    Tarif journalier
                                  </p>

                                  <p className="mt-1 text-xs font-black text-[#333333]">
                                    {formatMoney(
                                      ligne.prix_journalier_unitaire
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-lg bg-white px-3 py-2.5">
                                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#A0A0A0]">
                                    Caution
                                  </p>

                                  <p className="mt-1 text-xs font-black text-[#333333]">
                                    {formatMoney(
                                      ligne.caution_unitaire
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 rounded-xl border border-[#F0D0D0] bg-[#FFF8F8] px-4 py-3 sm:min-w-[145px] sm:text-right">
                              <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#A06A6A]">
                                Sous-total
                              </p>

                              <p className="mt-1 text-base font-black text-[#CC0000]">
                                {formatMoney(
                                  ligne.sous_total
                                )}
                              </p>
                            </div>
                          </div>

                          {ligne.notes?.trim() && (
                            <div className="mt-4 border-t border-[#E8E8E8] pt-4">
                              <div className="flex items-start gap-2.5">
                                <AdminIcon name="file" size={14} className="mt-0.5 shrink-0 text-[#999999]" />

                                <div>
                                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#999999]">
                                    Note
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#666666]">
                                    {ligne.notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>

            {/* ==================================================
                NOTES CLIENT
            ================================================== */}

            {hasClientNotes && (
              <section
                className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_3px_18px_rgba(0,0,0,0.025)] sm:p-6"
                aria-labelledby="reservation-notes-title"
              >
                <SectionHeader
                  icon="file"
                  eyebrow="Message"
                  title="Vos notes"
                />

                <div className="mt-5 rounded-xl border border-[#ECECEC] bg-[#F8F8F8] p-4">
                  <p className="whitespace-pre-wrap text-xs leading-6 text-[#666666] sm:text-sm">
                    {reservation.notes_client}
                  </p>
                </div>
              </section>
            )}

            {/* ==================================================
                INFORMATIONS IMPORTANTES
            ================================================== */}

            <section
              className="rounded-2xl border border-[#E5E5E5] bg-white p-5 shadow-[0_3px_18px_rgba(0,0,0,0.025)] sm:p-6"
              aria-labelledby="reservation-information-title"
            >
              <SectionHeader
                icon="shield"
                eyebrow="Sécurité"
                title="Informations importantes"
              />

              <div className="mt-5 grid gap-3">
                <div className="flex items-start gap-3 rounded-xl border border-[#E9E9E9] bg-[#FAFAFA] p-3.5">
                  <AdminIcon name="check-circle" size={16} className="mt-0.5 shrink-0 text-[#188A3B]" />

                  <p className="text-xs leading-5 text-[#666666]">
                    Les montants affichés sont calculés
                    par le serveur et correspondent aux
                    données de la réservation enregistrée.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#E9E9E9] bg-[#FAFAFA] p-3.5">
                  <AdminIcon name="check-circle" size={16} className="mt-0.5 shrink-0 text-[#188A3B]" />

                  <p className="text-xs leading-5 text-[#666666]">
                    La disponibilité des véhicules et les
                    règles métier sont contrôlées côté
                    serveur.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#E9E9E9] bg-[#FAFAFA] p-3.5">
                  <AdminIcon name="check-circle" size={16} className="mt-0.5 shrink-0 text-[#188A3B]" />

                  <p className="text-xs leading-5 text-[#666666]">
                    Conservez votre numéro de réservation
                    pour toute communication avec
                    KJOURRENTACAR.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            {/* ==================================================
                RÉSUMÉ
            ================================================== */}

            <section
              className="overflow-hidden rounded-2xl border border-[#E4E4E4] bg-white shadow-[0_5px_24px_rgba(0,0,0,0.045)]"
              aria-labelledby="reservation-summary-title"
            >
              <div className="relative overflow-hidden bg-[#111111] px-5 py-5">
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#CC0000]/20 blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#888888]">
                        Récapitulatif
                      </p>

                      <h2
                        id="reservation-summary-title"
                        className="mt-1 text-lg font-black tracking-tight text-white"
                      >
                        Réservation
                      </h2>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      <AdminIcon name="clipboard-check" size={17} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {/* Numéro */}

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#999999]">
                    Numéro
                  </p>

                  <p className="mt-1.5 break-all text-sm font-black text-[#111111]">
                    {reservation.numero}
                  </p>
                </div>

                {/* Statut */}

                <div className="mt-5">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#999999]">
                    Statut
                  </p>

                  <div
                    className={[
                      "mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black",
                      statusConfig.badgeClassName,
                    ].join(" ")}
                  >
                    <AdminIcon
                      name={statusConfig.icon}
                      size={13}
                      strokeWidth={2}
                    />

                    {reservation.statut_display ||
                      statusConfig.label}
                  </div>
                </div>

                {/* Dates */}

                <div className="mt-5 border-t border-[#EEEEEE] pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#999999]">
                        Créée le
                      </p>

                      <p className="mt-1 text-xs font-black text-[#222222]">
                        {formatDateTime(
                          reservation.created_at
                        )}
                      </p>
                    </div>

                    {reservation.date_confirmation && (
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#999999]">
                          Confirmée
                        </p>

                        <p className="mt-1 text-xs font-black text-[#222222]">
                          {formatDateTime(
                            reservation.date_confirmation
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#F7F7F7] p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#999999]">
                      Durée
                    </p>

                    <p className="mt-1 text-sm font-black text-[#111111]">
                      {reservation.nombre_jours} j
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F7F7F7] p-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#999999]">
                      Véhicules
                    </p>

                    <p className="mt-1 text-sm font-black text-[#111111]">
                      {vehicleCount}
                    </p>
                  </div>
                </div>

                {/* Tarification */}

                <div className="mt-5 border-t border-[#EEEEEE] pt-5">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#999999]">
                    Tarification
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-xs text-[#666666]">
                      Montant total
                    </span>

                    <span className="text-sm font-black text-[#111111]">
                      {formatMoney(
                        reservation.montant_total
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                      <AdminIcon name="shield" size={14} className="text-[#999999]" />

                      <span className="text-xs text-[#666666]">
                        Caution
                      </span>
                    </div>

                    <span className="text-sm font-black text-[#111111]">
                      {formatMoney(
                        reservation.caution_totale
                      )}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#111111] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#999999]">
                        Total location
                      </span>

                      <span className="text-lg font-black text-white">
                        {formatMoney(
                          reservation.montant_total
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Paiement */}

                <div className="mt-5 border-t border-[#EEEEEE] pt-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F1]">
                      <AdminIcon name="credit-card" size={16} className="text-[#B4232F]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#111111]">
                        État du paiement
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-[#777777]">
                        {reservation.paiement_reussi
                          ? "Un paiement réussi est associé à cette réservation."
                          : "Aucun paiement réussi n'est actuellement associé à cette réservation."}
                      </p>
                    </div>
                  </div>

                  <div
                    className={[
                      "mt-3 rounded-xl px-3.5 py-2.5 text-[10px] font-black",
                      reservation.paiement_reussi
                        ? "bg-[#EAF8EE] text-[#188A3B]"
                        : "bg-[#F7F7F7] text-[#666666]",
                    ].join(" ")}
                  >
                    {reservation.paiement_reussi
                      ? "Paiement confirmé"
                      : "Paiement non confirmé"}
                  </div>
                </div>

                {/* Origine */}

                <div className="mt-5 border-t border-[#EEEEEE] pt-5">
                  <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#999999]">
                    Origine de la demande
                  </p>

                  <p className="mt-1.5 text-xs font-black text-[#333333]">
                    {reservation.source_display}
                  </p>
                </div>
              </div>
            </section>

            {/* ==================================================
                RAPPEL
            ================================================== */}

            <section className="rounded-2xl border border-[#E4E4E4] bg-white p-5 shadow-[0_3px_18px_rgba(0,0,0,0.025)]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFFAF2]">
                  <AdminIcon name="shield" size={18} className="text-[#16845B]" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black text-[#111111]">
                    Réservation enregistrée
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-[#707070]">
                    Cette réservation est enregistrée dans
                    votre compte client. Utilisez le numéro{" "}
                    <span className="font-black text-[#333333]">
                      {reservation.numero}
                    </span>{" "}
                    pour communiquer avec notre équipe.
                  </p>
                </div>
              </div>
            </section>

            {/* ==================================================
                NOUVELLE RÉSERVATION
            ================================================== */}

            <button
              type="button"
              onClick={onNewReservation}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#CC0000] px-5 py-3.5 text-xs font-black text-white shadow-[0_8px_24px_rgba(204,0,0,0.18)] transition-all duration-200 hover:bg-[#A80000] hover:shadow-[0_10px_28px_rgba(204,0,0,0.24)] focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:ring-offset-2 active:scale-[0.99]"
            >
              <AdminIcon
                name="plus-circle"
                size={18}
                className="transition-transform duration-200 group-hover:rotate-90"
              />

              Nouvelle réservation
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

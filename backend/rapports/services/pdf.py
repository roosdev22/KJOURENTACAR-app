from io import BytesIO
from datetime import date, datetime
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)


TITRES = {
    "FINANCIER": "Rapport financier",
    "RESERVATIONS": "Rapport des réservations",
    "VEHICULES": "Rapport du parc automobile",
    "CONTRATS": "Rapport des contrats",
    "MAINTENANCE": "Rapport de maintenance",
}


def _texte(valeur):
    if valeur is None:
        return "—"
    if isinstance(valeur, (date, datetime)):
        return valeur.strftime("%d/%m/%Y")
    if isinstance(valeur, Decimal):
        return f"{valeur:,.2f}"
    if isinstance(valeur, bool):
        return "Oui" if valeur else "Non"
    if isinstance(valeur, dict):
        return ", ".join(
            f"{cle} : {_texte(item)}"
            for cle, item in valeur.items()
        )
    if isinstance(valeur, list):
        return ", ".join(_texte(item) for item in valeur) or "Aucune donnée"
    return str(valeur)


def _libelle(cle):
    return str(cle).replace("_", " ").capitalize()


def _ajouter_section(elements, titre, donnees, styles):
    elements.append(Paragraph(titre, styles["Heading2"]))
    elements.append(Spacer(1, 3 * mm))

    if isinstance(donnees, list):
        if not donnees:
            elements.append(Paragraph("Aucune donnée pour cette section.", styles["Normal"]))
            elements.append(Spacer(1, 4 * mm))
            return

        if all(isinstance(ligne, dict) for ligne in donnees):
            colonnes = list(dict.fromkeys(
                cle for ligne in donnees for cle in ligne.keys()
            ))
            tableau = [[_libelle(cle) for cle in colonnes]]

            for ligne in donnees:
                tableau.append([
                    Paragraph(
                        _texte(ligne.get(cle)),
                        styles["Cellule"],
                    )
                    for cle in colonnes
                ])

            largeurs = [
                (landscape(A4)[0] - 30 * mm) / max(len(colonnes), 1)
            ] * len(colonnes)

            table = Table(
                tableau,
                colWidths=largeurs,
                repeatRows=1,
                hAlign="LEFT",
            )
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#202020")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("LEADING", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D0D0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                    colors.white,
                    colors.HexColor("#F4F4F4"),
                ]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph(_texte(donnees), styles["Normal"]))

    elif isinstance(donnees, dict):
        lignes = [[
            Paragraph("Indicateur", styles["CelluleEntete"]),
            Paragraph("Valeur", styles["CelluleEntete"]),
        ]]

        for cle, valeur in donnees.items():
            lignes.append([
                Paragraph(_libelle(cle), styles["Cellule"]),
                Paragraph(_texte(valeur), styles["Cellule"]),
            ])

        table = Table(lignes, colWidths=[65 * mm, 105 * mm], repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#202020")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#D0D0D0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                colors.white,
                colors.HexColor("#F4F4F4"),
            ]),
        ]))
        elements.append(table)
    else:
        elements.append(Paragraph(_texte(donnees), styles["Normal"]))

    elements.append(Spacer(1, 6 * mm))


def generer_pdf(type_rapport, donnees, date_debut, date_fin):
    """
    Produit le contenu PDF en mémoire.
    Le fichier est ensuite enregistré par le service de génération
    dans le stockage privé de Django.
    """
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
        title=TITRES.get(type_rapport, "Rapport K-JOU RENT A CAR"),
        author="K-JOU RENT A CAR",
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="TitreRapport",
        parent=styles["Title"],
        alignment=TA_CENTER,
        textColor=colors.HexColor("#B91C1C"),
        spaceAfter=5 * mm,
    ))
    styles.add(ParagraphStyle(
        name="Cellule",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        wordWrap="CJK",
    ))
    styles.add(ParagraphStyle(
        name="CelluleEntete",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    ))

    elements = [
        Paragraph("K-JOU RENT A CAR", styles["TitreRapport"]),
        Paragraph(
            TITRES.get(type_rapport, "Rapport"),
            styles["Heading1"],
        ),
        Spacer(1, 3 * mm),
    ]

    if type_rapport == "VEHICULES":
        periode = f"État du parc au {date_fin:%d/%m/%Y}"
    else:
        periode = (
            f"Période : {date_debut:%d/%m/%Y} "
            f"au {date_fin:%d/%m/%Y}"
        )

    elements.append(Paragraph(periode, styles["Normal"]))
    elements.append(Spacer(1, 8 * mm))

    for cle, valeur in donnees.items():
        if cle in ("date_debut", "date_fin"):
            continue

        titre = _libelle(cle)
        if cle == "note_remboursements":
            elements.append(KeepTogether([
                Paragraph(titre, styles["Heading2"]),
                Paragraph(_texte(valeur), styles["Normal"]),
                Spacer(1, 5 * mm),
            ]))
        else:
            _ajouter_section(elements, titre, valeur, styles)

    document.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
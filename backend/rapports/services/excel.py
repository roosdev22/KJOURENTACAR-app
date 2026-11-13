from io import BytesIO
from datetime import date, datetime
from decimal import Decimal

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter


TITRES = {
    "FINANCIER": "Rapport financier",
    "RESERVATIONS": "Rapport des réservations",
    "VEHICULES": "Rapport du parc automobile",
    "CONTRATS": "Rapport des contrats",
    "MAINTENANCE": "Rapport de maintenance",
}

ROUGE = "B91C1C"
NOIR = "202020"
GRIS = "F2F2F2"
BLANC = "FFFFFF"


def _valeur_excel(valeur):
    if isinstance(valeur, (dict, list)):
        return str(valeur)
    if isinstance(valeur, Decimal):
        return float(valeur)
    if isinstance(valeur, (date, datetime)):
        return valeur
    return valeur


def _libelle(cle):
    return str(cle).replace("_", " ").capitalize()


def _ajouter_section(feuille, titre, donnees):
    feuille.append([])
    feuille.append([titre])
    ligne_titre = feuille.max_row

    feuille.cell(ligne_titre, 1).font = Font(
        bold=True,
        color=BLANC,
        size=12,
    )
    feuille.cell(ligne_titre, 1).fill = PatternFill(
        "solid",
        fgColor=NOIR,
    )

    if isinstance(donnees, list):
        if not donnees:
            feuille.append(["Aucune donnée"])
            return

        if all(isinstance(ligne, dict) for ligne in donnees):
            colonnes = list(dict.fromkeys(
                cle for ligne in donnees for cle in ligne.keys()
            ))

            feuille.append([_libelle(cle) for cle in colonnes])
            ligne_entete = feuille.max_row

            for cellule in feuille[ligne_entete]:
                cellule.font = Font(bold=True, color=BLANC)
                cellule.fill = PatternFill("solid", fgColor=ROUGE)
                cellule.alignment = Alignment(
                    horizontal="center",
                    vertical="center",
                    wrap_text=True,
                )

            for ligne in donnees:
                feuille.append([
                    _valeur_excel(ligne.get(cle))
                    for cle in colonnes
                ])
        else:
            feuille.append([_valeur_excel(item) for item in donnees])

    elif isinstance(donnees, dict):
        feuille.append(["Indicateur", "Valeur"])
        ligne_entete = feuille.max_row

        for cellule in feuille[ligne_entete]:
            cellule.font = Font(bold=True, color=BLANC)
            cellule.fill = PatternFill("solid", fgColor=ROUGE)

        for cle, valeur in donnees.items():
            feuille.append([_libelle(cle), _valeur_excel(valeur)])

    else:
        feuille.append([_valeur_excel(donnees)])


def generer_excel(type_rapport, donnees, date_debut, date_fin):
    """
    Produit le classeur Excel en mémoire.
    Le service de génération enregistrera ensuite le fichier
    dans le stockage privé de Django.
    """
    classeur = Workbook()
    feuille = classeur.active
    feuille.title = "Rapport"

    feuille.append(["K-JOU RENT A CAR"])
    feuille["A1"].font = Font(
        bold=True,
        size=18,
        color=ROUGE,
    )

    feuille.append([TITRES.get(type_rapport, "Rapport")])
    feuille["A2"].font = Font(bold=True, size=14)

    if type_rapport == "VEHICULES":
        periode = f"État du parc au {date_fin:%d/%m/%Y}"
    else:
        periode = (
            f"Période : {date_debut:%d/%m/%Y} "
            f"au {date_fin:%d/%m/%Y}"
        )

    feuille.append([periode])
    feuille.append([])

    for cle, valeur in donnees.items():
        if cle in ("date_debut", "date_fin"):
            continue
        _ajouter_section(feuille, _libelle(cle), valeur)

    bordure = Border(
        bottom=Side(style="thin", color="D0D0D0")
    )

    for ligne in feuille.iter_rows():
        for cellule in ligne:
            cellule.border = bordure
            cellule.alignment = Alignment(
                vertical="top",
                wrap_text=True,
            )

    for colonne in feuille.columns:
        lettre = get_column_letter(colonne[0].column)
        largeur_max = max(
            (
                len(str(cellule.value))
                for cellule in colonne
                if cellule.value is not None
            ),
            default=10,
        )
        feuille.column_dimensions[lettre].width = min(
            max(largeur_max + 2, 14),
            40,
        )

    feuille.freeze_panes = "A5"
    feuille.sheet_view.showGridLines = False

    buffer = BytesIO()
    classeur.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
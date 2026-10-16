from celery import shared_task

from reservations.services import expire_reservations


@shared_task(
    name="reservations.expire_reservations",
)
def expire_reservations_task() -> int:
    """
    Tâche Celery chargée d'expirer automatiquement
    les réservations arrivées à leur date de début.

    La logique métier reste dans reservations.services.
    Celery se contente de déclencher le traitement.
    """

    return expire_reservations()
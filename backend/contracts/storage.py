from django.conf import settings
from django.core.files.storage import FileSystemStorage


class PrivateContractStorage(FileSystemStorage):
    """
    Stockage local des contrats.
    Les fichiers doivent être servis via un endpoint
    authentifié, et non exposés directement par une URL publique.
    """

    def __init__(self, *args, **kwargs):
        kwargs.setdefault(
            "location",
            str(settings.BASE_DIR / "private_media" / "contracts"),
        )
        kwargs.setdefault("base_url", None)
        super().__init__(*args, **kwargs)

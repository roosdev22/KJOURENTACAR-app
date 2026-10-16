from rest_framework import serializers

from .models import Contract
from .services import MAX_SIGNED_PDF_SIZE


class ContractSerializer(serializers.ModelSerializer):
    reservation_number = serializers.CharField(
        source="reservation.numero",
        read_only=True,
    )
    generated_available = serializers.SerializerMethodField()
    signed_available = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            "id",
            "reference",
            "reservation",
            "reservation_number",
            "status",
            "generated_at",
            "signed_at",
            "cancelled_at",
            "generated_available",
            "signed_available",
        ]
        read_only_fields = fields

    def get_generated_available(self, obj):
        return bool(obj.generated_file and obj.generated_file.name)

    def get_signed_available(self, obj):
        return bool(obj.signed_file and obj.signed_file.name)


class SignedContractUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, uploaded_file):
        if uploaded_file.size > MAX_SIGNED_PDF_SIZE:
            raise serializers.ValidationError(
                "Le fichier ne doit pas dépasser 15 Mo."
            )

        extension = uploaded_file.name.rsplit(".", 1)[-1].lower()
        if extension != "pdf":
            raise serializers.ValidationError(
                "Seuls les fichiers PDF sont acceptés."
            )

        header = uploaded_file.read(5)
        uploaded_file.seek(0)

        if header != b"%PDF-":
            raise serializers.ValidationError(
                "Le fichier ne possède pas une signature PDF valide."
            )

        return uploaded_file

from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    est_lue = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "titre",
            "message",
            "lien",
            "est_lue",
            "lue_le",
            "cree_le",
        ]
        read_only_fields = fields

    def get_est_lue(self, obj):
        return obj.lue_le is not None

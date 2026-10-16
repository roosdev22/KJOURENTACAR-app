from django.urls import path

from payments.views import (
    PaymentListCreateView,
    PaymentDetailView,
    PaymentConfirmView,
    PaymentCancelView,
    PaymentRefundView,
    ReservationPaymentSummaryView,
    ReservationPaymentsView,
)


urlpatterns = [
    path(
        "",
        PaymentListCreateView.as_view(),
        name="payment-list-create",
    ),
    path(
        "<uuid:payment_uuid>/",
        PaymentDetailView.as_view(),
        name="payment-detail",
    ),
    path(
        "<uuid:payment_uuid>/confirm/",
        PaymentConfirmView.as_view(),
        name="payment-confirm",
    ),
    path(
        "<uuid:payment_uuid>/cancel/",
        PaymentCancelView.as_view(),
        name="payment-cancel",
    ),
    path(
        "<uuid:payment_uuid>/refund/",
        PaymentRefundView.as_view(),
        name="payment-refund",
    ),
    path(
        "reservations/<uuid:reservation_id>/summary/",
        ReservationPaymentSummaryView.as_view(),
        name="reservation-payment-summary",
    ),
    path(
        "reservations/<uuid:reservation_id>/",
        ReservationPaymentsView.as_view(),
        name="reservation-payments",
    ),
]
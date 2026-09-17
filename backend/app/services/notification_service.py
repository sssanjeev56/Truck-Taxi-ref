"""
Notification helper service
"""
from sqlalchemy.orm import Session
from app.models.models import Notification, NotificationType


def create_notification(
    db: Session,
    user_id: int,
    notif_type: NotificationType,
    title: str,
    message: str,
    related_booking_id: int = None,
):
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        related_booking_id=related_booking_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

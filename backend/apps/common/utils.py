from django.db import transaction, connection
from .models import AuditLog, DisplaySequenceCounter

def generate_next_display_id(key: str, prefix: str, padding: int = 6) -> str:
    """
    Generates a permanent, non-reusable display ID in a thread-safe and transaction-safe manner.
    Uses select_for_update() row-level locking on DisplaySequenceCounter inside an atomic transaction.
    """
    with transaction.atomic():
        if connection.features.has_select_for_update:
            try:
                counter, _ = DisplaySequenceCounter.objects.select_for_update().get_or_create(key=key)
            except Exception:
                counter, _ = DisplaySequenceCounter.objects.get_or_create(key=key)
        else:
            counter, _ = DisplaySequenceCounter.objects.get_or_create(key=key)

        counter.last_value += 1
        counter.save(update_fields=['last_value'])
        num_str = f"{counter.last_value:0{padding}d}"
        return f"{prefix}-{num_str}"

def log_action(request=None, actor=None, action="", target_model="", target_id="", target_name="", ip_address=None):
    if request:
        if not actor and request.user and request.user.is_authenticated:
            actor = request.user
        if not ip_address:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')

    actor_email = actor.email if actor else ""
    
    # Store dynamic audit log
    AuditLog.objects.create(
        actor=actor if (actor and hasattr(actor, 'pk') and actor.pk) else None,
        actor_email=actor_email,
        action=action,
        target_model=target_model,
        target_id=str(target_id) if target_id else "",
        target_name=str(target_name) if target_name else "",
        ip_address=ip_address
    )

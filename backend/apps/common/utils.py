from .models import AuditLog

def log_action(request=None, actor=None, action="", target_model="", target_id="", ip_address=None):
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
        target_id=str(target_id),
        ip_address=ip_address
    )

class RoleScopedQuerysetMixin:
    """
    Mixin to enforce role-scoped queryset filtering. 
    Ensures non-admin users can only query records owned by them,
    while allowing public/farmer access to accepted marketplace supplies and open requirements on landing page.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        model = queryset.model
        
        if not user.is_authenticated:
            if model.__name__ == 'Supply':
                return queryset.filter(
                    status='accepted',
                    is_archived=False,
                    visibility_scope__in=['PUBLIC', 'public']
                )
            if model.__name__ == 'Product':
                return queryset.filter(status='open')
            return queryset.none()
            
        if user.role == 'admin':
            return queryset
            
        # Farmer specific filtering
        if user.role == 'farmer':
            if model.__name__ == 'Supply':
                # If farmer is querying their own dashboard ('My Supplies'), return farmer's supplies
                if self.request.query_params.get('my_supplies') == 'true' and hasattr(user, 'farmer_profile'):
                    return queryset.filter(farmer=user.farmer_profile)
                # Otherwise for marketplace landing page, return accepted public/registered supplies + farmer's own
                from django.db.models import Q
                q_own = Q(farmer=user.farmer_profile) if hasattr(user, 'farmer_profile') else Q()
                q_public = Q(status='accepted', is_archived=False, visibility_scope__in=['PUBLIC', 'public', 'REGISTERED_CLIENTS', 'all_clients'])
                return queryset.filter(q_own | q_public).distinct()

            if hasattr(model, 'farmer') and hasattr(user, 'farmer_profile'):
                return queryset.filter(farmer=user.farmer_profile)
            if hasattr(model, 'user'):
                return queryset.filter(user=user)
                
        # Client specific filtering
        if user.role == 'client':
            if model.__name__ == 'Supply':
                from django.db.models import Q
                user_client_profile = getattr(user, 'client_profile', None)
                
                q_public = Q(visibility_scope__in=['PUBLIC', 'public'])
                q_registered = Q(visibility_scope__in=['REGISTERED_CLIENTS', 'all_clients'])
                q_specific = Q(
                    visibility_scope__in=['SPECIFIC_CLIENTS', 'specific_clients'],
                    target_clients__user=user
                )
                if user_client_profile:
                    q_specific = q_specific | Q(
                        visibility_scope__in=['SPECIFIC_CLIENTS', 'specific_clients'],
                        target_clients=user_client_profile
                    )

                return queryset.filter(
                    Q(status='accepted', is_archived=False) & (q_public | q_registered | q_specific)
                ).distinct()
            if model.__name__ == 'Product':
                return queryset
            if hasattr(model, 'client') and hasattr(user, 'client_profile'):
                return queryset.filter(client=user.client_profile)
            if hasattr(model, 'user'):
                return queryset.filter(user=user)
                
        return queryset.none()

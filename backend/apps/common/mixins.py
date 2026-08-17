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
                return queryset.filter(status='accepted', is_archived=False)
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
                # Otherwise for marketplace landing page, return all accepted non-archived supplies + farmer's own
                if hasattr(user, 'farmer_profile'):
                    from django.db.models import Q
                    return queryset.filter(Q(status='accepted', is_archived=False) | Q(farmer=user.farmer_profile)).distinct()
                return queryset.filter(status='accepted', is_archived=False)

            if hasattr(model, 'farmer') and hasattr(user, 'farmer_profile'):
                return queryset.filter(farmer=user.farmer_profile)
            if hasattr(model, 'user'):
                return queryset.filter(user=user)
                
        # Client specific filtering
        if user.role == 'client':
            if model.__name__ == 'Supply':
                return queryset.filter(status='accepted', is_archived=False)
            if model.__name__ == 'Product':
                return queryset
            if hasattr(model, 'client') and hasattr(user, 'client_profile'):
                return queryset.filter(client=user.client_profile)
            if hasattr(model, 'user'):
                return queryset.filter(user=user)
                
        return queryset.none()

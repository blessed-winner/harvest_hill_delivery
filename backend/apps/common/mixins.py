class RoleScopedQuerysetMixin:
    """
    Mixin to enforce role-scoped queryset filtering. 
    Ensures non-admin users can only query records owned by them.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
            
        if user.role == 'admin':
            return queryset
            
        model = queryset.model
        
        # Farmer specific filtering
        if user.role == 'farmer':
            if hasattr(model, 'farmer') and hasattr(user, 'farmer_profile'):
                return queryset.filter(farmer=user.farmer_profile)
            if hasattr(model, 'user'):
                return queryset.filter(user=user)
                
        # Client specific filtering
        if user.role == 'client':
            if hasattr(model, 'client') and hasattr(user, 'client_profile'):
                return queryset.filter(client=user.client_profile)
            if hasattr(model, 'user'):
                return queryset.filter(user=user)
                
        return queryset.none()

from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "client"

class IsFarmer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "farmer"

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Admin can access everything
        if request.user.role == 'admin':
            return True
            
        # Check basic ownership fields
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'farmer') and hasattr(request.user, 'farmer_profile'):
            return obj.farmer == request.user.farmer_profile
            
        if hasattr(obj, 'client') and hasattr(request.user, 'client_profile'):
            return obj.client == request.user.client_profile
            
        return False

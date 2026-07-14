from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # standardizing response structure
        custom_data = {
            'status_code': response.status_code,
            'errors': response.data
        }
        response.data = custom_data

    return response

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from tethys_sdk.gizmos import Button
from tethys_sdk.services import get_dataset_engine, ensure_oauth2
from .app import EpanetModelViewer as app

@login_required()
def home(request):
    """
    Controller for the app home page.
    """

    next_button = Button(
        display_text='Next',
        name='next-button',
        attributes={
            'data-toggle':'tooltip',
            'data-placement':'top',
            'title':'Next'
        }
    )

    context = {
        'next_button': next_button,
    }

    return render(request, 'epanet_model_viewer/home.html', context)


@ensure_oauth2('hydroshare')
def my_controller(request):
    """
    This is an example controller that uses the HydroShare API.
    """
    engine = app.get_dataset_service('hydroshare', request=request)

    response = engine.list_datasets()

    print(response)

    context = {
        'datasets': response
    }

    return render(request, 'epanet_model_viewer/home.html', context)

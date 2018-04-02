from tethys_sdk.base import TethysAppBase, url_map_maker
from tethys_sdk.app_settings import DatasetServiceSetting
from tethys_sdk.app_settings import PersistentStoreDatabaseSetting


class EpanetModelViewer(TethysAppBase):
    """
    Tethys app class for Epanet Model Viewer.
    """

    name = 'EPANET Model Viewer'
    index = 'epanet_model_viewer:home'
    icon = 'epanet_model_viewer/images/CIMM.png'
    package = 'epanet_model_viewer'
    root_url = 'epanet-model-viewer'
    color = '#915F6D'
    description = 'Place a brief description of your app here.'
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        url_map = url_map_maker(self.root_url)

        url_maps = (
            url_map(name='home',
                    url='epanet-model-viewer',
                    controller='epanet_model_viewer.controllers.home'),
            url_map(name='get_hs_res_list',
                    url='epanet-model-viewer/get-hs-res-list',
                    controller='epanet_model_viewer.ajax_controllers.get_hs_res_list'),
            url_map(name='ajax_add_hs_res',
                    url='epanet-model-viewer/add-hs-res',
                    controller='epanet_model_viewer.ajax_controllers.add_hs_res')
            )

        return url_maps

    # def dataset_service_settings(self):
    #     """
    #     Hydroshare dataset_service_settings method.
    #     """
    #
    #     ds_settings = (
    #         DatasetServiceSetting(
    #             name='hydroshare',
    #             description='HydroShare service for app to use.',
    #             engine=DatasetServiceSetting.HYDROSHARE,
    #             required=False
    #         ),
    #     )
    #
    #     return ds_settings
    #
    # def persistent_store_settings(self):
    #     ps_settings = (
    #         PersistentStoreDatabaseSetting(
    #             name='epanet_model_viewer_db',
    #             description='Primary database for epanet_model_viewer.',
    #             initializer='epanet_model_viwer.model.init_epanet_model_viewer_db',
    #             required=True
    #         ),
    #     )
    #
    #     return ps_settings

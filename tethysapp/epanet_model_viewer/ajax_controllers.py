from django.http import JsonResponse

from hs_restclient import HydroShare
from utilities import get_hs_auth_obj, validate_res_request, get_res_layers_from_db, process_nongeneric_res
import requests


message_template_wrong_req_method = 'This request can only be made through a "{method}" AJAX call.'
message_template_param_unfilled = 'The required "{param}" parameter was not fulfilled.'


def get_hs_res_list(request):
    """
    This is an example controller that uses the HydroShare API.
    """
    return_obj = {
        'success': False,
        'message': None,
        'res_list': None
    }

    if request.is_ajax() and request.method == 'GET':

        hs = HydroShare()

        res_list = []

        try:
            for res in hs.resources(type="ModelInstanceResource"):

                science_metadata_json = hs.getScienceMetadata(res['resource_id'])

                if not science_metadata_json['executed_by'] is None:
                    if science_metadata_json['executed_by']['modelProgramName'] == 'EPANET_2.0':
                        subjects = []
                        for subject in science_metadata_json['subjects']:
                            subjects.append(" " + subject['value'])

                        res_list.append({
                            'title': res['resource_title'],
                            'id': res['resource_id'],
                            'type': res['resource_type'],
                            'owner': res['creator'],
                            'subjects': subjects
                        })

            return_obj['res_list'] = res_list
            return_obj['success'] = True

        except:
            return_obj['message'] = 'The HydroShare server appears to be down.'
    else:
        return_obj['error'] = message_template_wrong_req_method.format(method="GET")

    return JsonResponse(return_obj)


def add_hs_res(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': ""
    }
    if request.is_ajax() and request.method == 'GET':
        if not request.GET.get('res_id'):
            return_obj['message'] = message_template_param_unfilled.format(param='res_id')
        else:
            res_id = request.GET['res_id']
            res_type = None
            res_title = None
            if request.GET.get('res_type'):
                res_type = request.GET['res_type']
            if request.GET.get('res_title'):
                res_title = request.GET['res_title']

            r = get_hs_auth_obj(request)
            if not r['success']:
                return_obj['message'] = r['message']
                return return_obj
            else:
                hs = r['hs_obj']
                r = validate_res_request(hs, res_id)
                if not r['can_access']:
                    return_obj['message'] = r['message']
                else:
                    for res_file in hs.getResourceFileList(res_id):
                        res = requests.get(res_file["url"])
                        return_obj['results'] = res.text
                        return_obj['success'] = True
                    # res_layers_obj_list = get_res_layers_from_db(hs, res_id, res_type, res_title, request.user.username)
                    # if res_layers_obj_list:
                    #     print("res layer ob list")
                    #     return_obj['results'] = res_layers_obj_list
                    #     return_obj['success'] = True
                    # else:
                    #     print("non gen")
                    # return_obj = process_nongeneric_res(hs, res_id, res_type, res_title, request.user.username)
                    # print(return_obj)

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="GET")

    return JsonResponse(return_obj)

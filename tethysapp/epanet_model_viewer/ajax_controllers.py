from django.http import JsonResponse

import os, tempfile

from hs_restclient import HydroShare
from tethys_services.backends.hs_restclient_helper import get_oauth_hs

from epanettools.epanettools import EPANetSimulation

import uuid

message_template_wrong_req_method = 'This request can only be made through a "{method}" AJAX call.'
message_template_param_unfilled = 'The required "{param}" parameter was not fulfilled.'


def get_epanet_model(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': "",
        'metadata': ""
    }

    if request.is_ajax() and request.method == 'GET':
        if not request.GET.get('model_id'):
            return_obj['message'] = message_template_param_unfilled.format(param='model_id')
        else:
            model_id = request.GET['model_id']

            try:
                hs = get_oauth_hs(request)
            except:
                hs = HydroShare()

            metadata_json = hs.getScienceMetadata(model_id)
            return_obj['metadata'] = metadata_json

            for model_file in hs.getResourceFileList(model_id):
                model_url = model_file['url']
                model_name = model_url[model_url.find('contents/') + 9:]

                model = ""
                for line in hs.getResourceFile(model_id, model_name):
                    model += line.decode('utf-8')

                return_obj['results'] = model
                return_obj['success'] = True

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="POST")

    return JsonResponse(return_obj)


def upload_epanet_model(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': "",
    }

    if request.is_ajax() and request.method == 'POST':
        try:
            hs = get_oauth_hs(request)
        except:
            hs = HydroShare()

        model_title = request.POST['model_title']
        resource_filename = model_title + ".inp"

        abstract = request.POST['model_description'] + '\n{%EPANET Model Repository%}'
        title = model_title

        user_keywords = ["EPANET_2.0"]
        for keyword in request.POST['model_keywords'].split(","):
            user_keywords.append(keyword)
        keywords = (tuple(user_keywords))

        rtype = 'ModelInstanceResource'
        extra_metadata = '{"modelProgram": "EPANET_2.0"}'

        fd, path = tempfile.mkstemp()
        with os.fdopen(fd, 'w') as tmp:
            tmp.write(request.POST['model_file'])
            fpath = path

        metadata = '[{"creator":{"name":"' + hs.getUserInfo()['first_name'] + ' ' + hs.getUserInfo()['last_name'] + '"}}]'

        resource_id = hs.createResource(rtype, title, resource_file=fpath, resource_filename=resource_filename, keywords=keywords, abstract=abstract, metadata=metadata, extra_metadata=extra_metadata)

        hs.setAccessRules(resource_id, public=True)

        return_obj['results'] = resource_id
        return_obj['success'] = True

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="GET")

    return JsonResponse(return_obj)


def run_epanet_model(request):
    return_obj = {
        'success': False,
        'message': None,
        'results': "",
    }

    if request.is_ajax() and request.method == 'POST':
        model = request.POST['model']
        quality = request.POST['quality']

        temp = 'tmp_' + str(uuid.uuid4()) + '.inp'

        with open(temp, 'w') as f:
            f.write(model)
        try:
            es = EPANetSimulation(temp)
            es.run()

            if quality != "NONE":
                es.runq()

            n = es.network.nodes
            nodes = getNodeResults(n)

            l = es.network.links
            links = getLinkResults(l)

            return_obj['results'] = {
                'nodes': nodes,
                'edges': links
            }

            return_obj['success'] = True

        except Exception as e:
            return_obj['message'] = e

        finally:
            os.remove(temp)

    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="POST")

    return JsonResponse(return_obj)


def getNodeResults(node_list):
    nodes = {}
    for node in node_list:
        node_id = node_list[node].id

        nodes[node_id] = {}
        nodes[node_id]["EN_QUALITY"] = node_list[node_id].results[12]
        nodes[node_id]["EN_PRESSURE"] = node_list[node_id].results[11]
        nodes[node_id]["EN_HEAD"] = node_list[node_id].results[10]
        nodes[node_id]["EN_DEMAND"] = node_list[node_id].results[9]

    return nodes


def getLinkResults(link_list):
    links = {}
    for link in link_list:
        link_id = link_list[link].id

        links[link_id] = {}
        links[link_id]["EN_FLOW"] = link_list[link_id].results[8]
        links[link_id]["EN_VELOCITY"] = link_list[link_id].results[9]
        links[link_id]["EN_ENERGY"] = link_list[link_id].results[13]
        links[link_id]["EN_HEADLOSS"] = link_list[link_id].results[10]

    return links

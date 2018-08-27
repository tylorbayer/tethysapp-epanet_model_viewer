from django.http import JsonResponse

import os, tempfile, pprint

from hs_restclient import HydroShare
from tethys_services.backends.hs_restclient_helper import get_oauth_hs
from .app import EpanetModelViewer as app

from epanettools.epanettools import EPANetSimulation, Node, Link, Control

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
                    model += line

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
    pp = pprint.PrettyPrinter()

    return_obj = {
        'success': False,
        'message': None,
        'results': "",
    }

    if request.is_ajax() and request.method == 'POST':
        model = request.POST['model']

        temp = 'tmp_' + str(uuid.uuid4()) + '.inp'

        with open(temp, 'w') as f:
            f.write(model)
        try:
            es = EPANetSimulation(temp)

            # print app.get_user_workspace(request).path

            es.run()

            nodes = {}
            node_list = es.network.nodes

            for node in node_list:
                node_vals = {}
                node_id = node_list[node].id

                for val_type in Node.value_type:
                    try:
                        node_vals[val_type] = ["%.2f" % member for member in node_list[node_id].results[Node.value_type[val_type]]]
                    except:
                        pass

                nodes[node_id] = node_vals

            links = {}
            link_list = es.network.links

            for link in link_list:
                link_vals = {}
                link_id = link_list[link].id

                for val_type in Link.value_type:
                    try:
                        link_vals[val_type] = ["%.2f" % member for member in link_list[link_id].results[Link.value_type[val_type]]]
                    except:
                        pass

                links[link_id] = link_vals

            report = {
                'nodes': nodes,
                'edges': links
            }

            return_obj['results'] = report
            return_obj['success'] = True

        except Exception as e:
            print e
            return_obj['Model failed to run: ' + e]

        finally:
            os.remove(temp)


    else:
        return_obj['message'] = message_template_wrong_req_method.format(method="POST")

    return JsonResponse(return_obj)

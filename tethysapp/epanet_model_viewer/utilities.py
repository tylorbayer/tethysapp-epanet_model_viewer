from model import Layer
from tethys_sdk.services import get_spatial_dataset_engine

from hs_restclient import HydroShare as hs_r
from tethys_services.backends.hs_restclient_helper import get_oauth_hs
from datetime import datetime
from sys import exc_info
import xmltodict
from json import dumps, loads
from logging import getLogger
from socket import gethostname
import os
import requests
from traceback import format_exception


logger = getLogger('django')
workspace_id = None
spatial_dataset_engine = None
currently_testing = False


def get_hs_auth_obj(request):
    return_obj = {
        'success': False,
        'message': None,
        'hs_obj': None
    }
    message_need_to_login = ('You must be signed in with your HydroShare account. '
                             'If you thought you had already done so, your login likely timed out. '
                             'In that case, please log in again')
    message_multiple_logins = 'It looks like someone is already logged in to this app with your HydroShare account.'

    # if '127.0.0.1' in request.get_host():
    #     hs = hs_r.HydroShare(auth=hs_r.HydroShareAuthBasic(username='test', password='test'))
    # else:
    try:
        hs = hs_r()
    except Exception as e:
        if "Not logged in through OAuth" in str(e):
            return_obj['message'] = message_need_to_login
            return return_obj
        else:
            return_obj['message'] = message_multiple_logins
            return return_obj

    return_obj['hs_obj'] = hs
    return_obj['success'] = True

    return return_obj


def validate_res_request(hs, res_id):
    return_obj = {
        'can_access': False,
        'message': None
    }
    try:
        hs.getScienceMetadataRDF(res_id)
        return_obj['can_access'] = True
    except hs_r.HydroShareNotAuthorized:
        return_obj['message'] = 'You are not authorized to access this resource.'
    except hs_r.HydroShareNotFound:
        return_obj['message'] = 'It appears that this resource does not exist on www.hydroshare.org'

    return return_obj


def get_res_layers_from_db(hs, res_id, res_type, res_title, username):
    print("getting layers from db")
    res_layers = []
    db_res_layers = Layer.get_layers_by_associated_res_id(res_id)

    if db_res_layers:
        for res_layer in db_res_layers:
            flag_reload_layer = res_was_updated(res_layer.res_mod_date, get_res_mod_date(hs, res_id))

            if flag_reload_layer:
                Layer.remove_layers_by_res_id(res_id)
                remove_layer_from_geoserver(res_id, None)
                response = process_nongeneric_res(hs, res_id, res_type, res_title, username)
                if response['success']:
                    res_layers = response['results']
                break
            else:
                res_layer = {
                    'res_id': res_id,
                    'res_type': res_layer.associated_res_type,
                    'layer_name': res_layer.name,
                    'layer_id': res_layer.layer_id,
                    'layer_extents': loads(res_layer.extents) if res_layer.extents else None,
                    'layer_attributes': res_layer.attributes,
                    'geom_type': res_layer.geom_type,
                    'band_info': loads(res_layer.band_info) if res_layer.band_info else None,
                    'site_info': loads(res_layer.site_info) if res_layer.site_info else None,
                    'public_fname': res_layer.associated_file_name
                }
                res_layers.append(res_layer)

    return res_layers


def process_nongeneric_res(hs, res_id, res_type=None, res_title=None, username=None):
    global currently_testing
    return_obj = {
        'success': False,
        'message': None,
        'results': []
    }

    results = return_obj['results']
    hs_tempdir = get_hs_tempdir(username)

    try:
        if res_type is None or res_title is None:
            md = hs.getSystemMetadata(res_id)
            res_type = md['resource_type']
            res_title = md['resource_title']

        print("response?")
        response = process_res_by_type(hs, res_id, res_type, hs_tempdir)
        print("response!")
        print(response)
        return_obj['message'] = response['message']
        if response['success']:
            for r in response['results']:
                result = {
                    'res_id': res_id,
                    'res_type': r['res_type'] if 'res_type' in r else res_type,
                    'layer_name': r['layer_name'] if ('layer_name' in r and r['layer_name'] is not None) else res_title,
                    'layer_id': r['layer_id'] if 'layer_id' in r else None,
                    'layer_extents': r['layer_extents'] if 'layer_extents' in r else None,
                    'layer_attributes': r['layer_attributes'] if 'layer_attributes' in r else None,
                    'geom_type': r['geom_type'] if 'geom_type' in r else None,
                    'band_info': r['band_info'] if 'band_info' in r else None,
                    'site_info': r['site_info'] if 'site_info' in r else None,
                    'project_info': r['project_info'] if 'project_info' in r else None,
                    'public_fname': r['public_fname'] if 'public_fname' in r else None,
                    'res_mod_date': get_res_mod_date(hs, res_id)
                }
                results.append(result)

                param_obj = prepare_result_for_layer_db(result)
                Layer.add_layer_to_database(**param_obj)
            return_obj['success'] = True
    except Exception as e:
        exc_type, exc_value, exc_traceback = exc_info()
        msg = e.message if e.message else str(e)
        logger.error(''.join(format_exception(exc_type, exc_value, exc_traceback)))
        logger.error(msg)
        if gethostname() == 'ubuntu':
            return_obj['message'] = 'An unexpected error ocurred: %s' % msg
        else:
            return_obj['message'] = 'An unexpected error ocurred. App admin has been notified.'
            if not currently_testing:
                user_info = hs.getUserInfo()
                msg += '\nHost: {host} \nRes Id: {id} \nRes Type: {type} \nUsername: {name} \nEmail: {email}'.format(
                    host=gethostname(), id=res_id, type=res_type, name=user_info['username'], email=user_info['email'])
                # email_admin('Error Report', traceback=exc_info(), custom_msg=msg)
    finally:
        os.system('rm -rf %s' % hs_tempdir)

    return return_obj


def res_was_updated(db_date, res_date):
    try:
        db_date_obj = datetime.strptime(db_date.split('+')[0], '%Y-%m-%dT%H:%M:%S.%f')
        res_date_obj = datetime.strptime(res_date.split('+')[0], '%Y-%m-%dT%H:%M:%S.%f')
        if db_date_obj < res_date_obj:
            return True
    except Exception as e:
        # email_admin('Minor Error Report', exc_info(), str(e))
        return True

    return False


def get_res_mod_date(hs, res_id):
    date_modified = None
    try:

        md_dict = xmltodict.parse(hs.getScienceMetadataRDF(res_id))

        for date_obj in md_dict['rdf:RDF']['rdf:Description'][0]['dc:date']:
            if 'dcterms:modified' in date_obj:
                date_modified = date_obj['dcterms:modified']['rdf:value']

    except Exception as e:
        logger.error(str(e))

    return date_modified


def remove_layer_from_geoserver(res_id, file_index=None):
    store_id = '{workspace}:{store}'.format(workspace=get_workspace(),
                                            store=get_geoserver_store_id(res_id, file_index))

    engine = return_spatial_dataset_engine()
    engine.delete_store(store_id, purge=True, recurse=True, debug=get_debug_val())


def prepare_result_for_layer_db(result):
    result.pop('project_info', None)  # parameter "project_info" not expected in following call

    # The values of the following keys, if they are not None, are python object that must converted to strings
    result['layer_extents'] = dumps(result['layer_extents']) if result['layer_extents'] else None
    result['band_info'] = dumps(result['band_info']) if result['band_info'] else None
    result['site_info'] = dumps(result['site_info']) if result['site_info'] else None

    return result


def return_spatial_dataset_engine():
    global spatial_dataset_engine
    if spatial_dataset_engine is None:
        spatial_dataset_engine = get_spatial_dataset_engine(name='default')

    return spatial_dataset_engine


def get_hs_tempdir(username=None, file_index=None):
    hs_tempdir = 'tmp/hs_gis_files'

    if username is not None:
        hs_tempdir = os.path.join(hs_tempdir, str(username))

    if file_index is not None:
        hs_tempdir = os.path.join(hs_tempdir, str(file_index))

    if not os.path.exists(hs_tempdir):
        os.makedirs(hs_tempdir)

    print(hs_tempdir)

    return hs_tempdir

def get_workspace():
    global workspace_id
    if workspace_id is None:
        if 'apps.hydroshare' in gethostname():
            workspace_id = 'hydroshare_gis'
        else:
            workspace_id = 'hydroshare_gis_testing'

    return workspace_id


def get_debug_val():
    global currently_testing
    val = False
    if gethostname() == 'ubuntu':
        if not currently_testing:
            val = True

    return val


# def email_admin(subject, traceback=None, custom_msg=None):
#     if traceback is None and custom_msg is None:
#         return -1
#
#     subject = 'HydroShare GIS: %s' % subject
#     msg = ''
#     if traceback:
#         exc_type, exc_value, exc_traceback = traceback
#         trcbck = ''.join(format_exception(exc_type, exc_value, exc_traceback))
#         msg += trcbck
#     if custom_msg:
#         msg += custom_msg
#     requests.post(
#         "https://api.mailgun.net/v3/sandbox5d62ce2f0725460bb5eab88b496fd2a6.mailgun.org/messages",
#         auth=("api", "key-6eee015c8a719e4510a093cabf7bdfd4"),
#         data={
#             "from": "Mailgun Sandbox <postmaster@sandbox5d62ce2f0725460bb5eab88b496fd2a6.mailgun.org>",
#             "to": "progrummer@gmail.com",
#             "subject": subject,
#             "text": msg
#         }
#     )


def get_geoserver_store_id(res_id, file_index=None):
    return 'gis_{res_id}{flag}'.format(res_id=res_id,
                                       flag='_{0}'.format(file_index) if file_index else '')


def process_res_by_type(hs, res_id, res_type, hs_tempdir):
    return_obj = {
        'success': False,
        'message': None,
        'results': []
    }
    '''
    Each result in results has these options
    {
            'layer_name': None,
            'res_type': res_type,
            'project_info': None,
            'layer_id': None,
            'band_info': None,
            'site_info': None,
            'layer_attributes': None,
            'layer_extents': None,
            'geom_type': None,
            'public_fname': None
    }
    '''
    results = return_obj['results']

    response = download_res_from_hs(hs, res_id, hs_tempdir)
    print("file name???")
    print(response)
    print("file name 2")

    if not response['success']:
        return_obj['message'] = response['message']
    else:
        res_contents_path = response['res_contents_path']
        response = get_info_from_nongeneric_res_files(res_id, res_type, res_contents_path)
        return_obj['message'] = response['message']
        if response['success']:
            error_occurred = False
            for r in response['results']:
                res_filepath = r['res_filepath'] if 'res_filepath' in r else None
                res_type = r['res_type'] if 'res_type' in r else None
                layer_name = r['layer_name'] if 'layer_name' in r else None
                public_fname = r['public_fname'] if 'public_fname' in r else None

                if res_type == 'GenericResource':
                    if res_filepath and res_filepath.endswith('mapProject.json'):
                        with open(res_filepath) as project_file:
                            project_info = project_file.read()
                        result = {
                            'res_type': res_type,
                            'project_info': project_info
                        }
                        results.append(result)
                        break
                    else:
                        result = {
                            'res_type': res_type,
                            'public_fname': public_fname,
                            'layer_name': layer_name,
                            'site_info': extract_site_info_from_hs_metadata(hs, res_id)
                        }
                        results.append(result)
                elif res_type == 'GeographicFeatureResource' or res_type == 'RasterResource':
                    check_res = upload_file_to_geoserver(res_id, res_type, res_filepath)
                    if not check_res['success']:
                        error_occurred = True
                        return_obj['message'] = check_res['message']
                        break
                    else:
                        response = check_res['results']
                        geoserver_layer_name = response['layer_name']
                        layer_id = response['layer_id']
                        store_id = response['store_id']

                        response = get_layer_md_from_geoserver(store_id=store_id, layer_name=geoserver_layer_name,
                                                               res_type=res_type)
                        if not response['success']:
                            error_occurred = True
                            return_obj['message'] = response['message']
                            break
                        else:
                            result = {
                                'layer_name': layer_name,
                                'res_type': res_type,
                                'layer_id': layer_id,
                                'layer_attributes': response['attributes'],
                                'layer_extents': response['extents'],
                                'geom_type': response['geom_type'],
                                'band_info': get_band_info(hs, res_id, res_type),
                                'public_fname': public_fname
                            }
                            results.append(result)
                else:
                    error_occurred = True
                    return_obj['message'] = 'Resource cannot be opened with HydroShare GIS: Invalid resource type.'

            if not error_occurred:
                return_obj['success'] = True

    return return_obj


def get_info_from_nongeneric_res_files(res_id, res_type, res_contents_path):
    return_obj = {
        'success': False,
        'message': None,
        'results': [],
    }
    '''
    Each result in 'results' has the following options
    {
            'res_filepath': None,
            'res_type': res_type,
            'layer_name': None
    }
    '''
    results = return_obj['results']

    if os.path.exists(res_contents_path):
        res_files_list = os.listdir(res_contents_path)

        print(res_files_list)

        for f in res_files_list:
            res = requests.get("http://www.hydroshare.org/hsapi/resource/" + str(res_id) + "/files/" + str(f))
            print(res.text)
            src = os.path.join(res_contents_path, f)
            new_fname = '{name}{ext}'.format(name=get_geoserver_store_id(res_id),
                                             ext=os.path.splitext(f)[1])
            dst = os.path.join(res_contents_path, new_fname)
            os.rename(src, dst)
        res_fname = get_geoserver_store_id(res_id)
        res_fpath = os.path.join(res_contents_path, res_fname)
        prj_path = res_fpath + '.prj'
        r = check_crs(res_type, prj_path)
        return_obj['message'] = r['message'] % os.path.basename(prj_path) if r['message'] else None
        if r['success'] and r['crsWasChanged']:
            with open(prj_path, 'w') as f:
                f.seek(0)
                f.write(r['new_wkt'])
                f.truncate()
        result = {
            'res_filepath': res_fpath,
            'res_type': res_type,
        }
        results.append(result)

        return_obj['success'] = True

    return return_obj


def download_res_from_hs(hs, res_id, tempdir):
    return_obj = {
        'success': False,
        'message': None,
        'res_contents_path': None
    }
    TOO_BIG_PREFIXES = ['G', 'T', 'P', 'E', 'Z']
    is_too_big = False
    res_size = 0
    for res_file in hs.getResourceFileList(res_id):
        print(res_file)
        res_size += res_file['size']

    for prefix in TOO_BIG_PREFIXES:
        if prefix in sizeof_fmt(res_size):
            is_too_big = True
            break

    if not is_too_big:
        print("not too big")
        print(tempdir)
        hs.getResource(res_id, destination=tempdir, unzip=True)
        res_contents_path = os.path.join(tempdir, res_id, res_id, 'data', 'contents')
        return_obj['res_contents_path'] = res_contents_path
        return_obj['success'] = True
    else:
        return_obj['message'] = 'This resource is too large to open in HydroShare GIS.'

    return return_obj


def sizeof_fmt(num, suffix='B'):
    for unit in ['bytes', 'k', 'M', 'G', 'T', 'P', 'E', 'Z']:
        if abs(num) < 1024.0:
            if unit == 'bytes':
                return "%3.1f %s" % (num, unit)
            return "%3.1f %s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)


def check_crs(res_type, fpath):
    return_obj = {
        'success': False,
        'message': None,
        'code': None,
        'crsWasChanged': False,
        'new_wkt': None
    }

    message_erroneous_proj = 'The file "%s" has erroneous or incomplete projection (coordinate reference system) ' \
                             'information. An attempt has still been made to display it, though it is likely ' \
                             'to be spatially incorrect.'

    with open(fpath) as f:
        crs = f.read()

    endpoint = 'http://prj2epsg.org/search.json'
    params = {
        'mode': 'wkt',
        'terms': crs
    }
    crs_is_unknown = True
    flag_unhandled_error = False
    try:
        while crs_is_unknown:
            r = requests.get(endpoint, params=params)
            if '50' in str(r.status_code):
                raise Exception
            elif r.status_code == 200:
                response = r.json()
                if 'errors' in response:
                    errs = response['errors']
                    if 'Invalid WKT syntax' in errs:
                        err = errs.split(':')[2]
                        if err and 'Parameter' in err:
                            crs_param = err.split('"')[1]
                            rm_indx_start = crs.find(crs_param)
                            rm_indx_end = None
                            sub_str = crs[rm_indx_start:]
                            counter = 0
                            check = False
                            for i, c in enumerate(sub_str):
                                if c == '[':
                                    counter += 1
                                    check = True
                                elif c == ']':
                                    counter -= 1
                                    check = True
                                if check:
                                    if counter == 0:
                                        rm_indx_end = i + rm_indx_start + 1
                                        break
                            crs = crs[:rm_indx_start] + crs[rm_indx_end:]
                            if ',' in crs[:-4]:
                                i = crs.rfind(',')
                                crs = crs[:i] + crs[i+1:]
                            params['terms'] = crs
                        else:
                            flag_unhandled_error = True
                    else:
                        flag_unhandled_error = True
                else:
                    crs_is_unknown = False
                    codes = response['codes']
                    # If there are no codes in the result, a match wasn't found. In that case, an attempt will still be
                    # made to add the layer to GeoServer since this still works in some cases.
                    if len(codes) != 0:
                        code = codes[0]['code']
                        if res_type == 'RasterResource':
                            if code not in crs:
                                return_obj['crsWasChanged'] = True
                            return_obj['code'] = 'EPSG:' + code
                        else:
                            r = requests.get(response['codes'][0]['url'])
                            proj_json = r.json()
                            raw_wkt = proj_json['wkt']
                            tmp_list = []
                            for seg in raw_wkt.split('\n'):
                                tmp_list.append(seg.strip())
                            if code not in crs:
                                return_obj['crsWasChanged'] = True
                                return_obj['new_wkt'] = ''.join(tmp_list)

                    return_obj['success'] = True

                if flag_unhandled_error:
                    return_obj['message'] = message_erroneous_proj
                    return_obj['crsWasChanged'] = True
                    return_obj['code'] = 'EPSG:3857'
                    return_obj['success'] = True
                    break
            else:
                params['mode'] = 'keywords'
                continue
    except Exception as e:
        e.message = 'A service that HydroShare GIS depends on currently appears to be down. An app admin has been notified to further investigate.'
        raise

    return return_obj

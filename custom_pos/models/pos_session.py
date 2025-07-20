from odoo import models


class PosSession(models.Model):
    _inherit = 'pos.session'

    def _loader_params_product_product(self):
        result = super()._loader_params_product_product()
        result['search_params']['fields'].append('brand_id')
        return result

    def _pos_ui_models_to_load(self):
        result = super()._pos_ui_models_to_load()
        result += ['product.brand']
        return result

    def _get_pos_ui_product_brand(self, params):
        return self.env['product.brand'].search_read(**params['search_params'])

    def _loader_params_product_brand(self):
        return {
            'search_params': {
                'domain': [],
                'fields': ['name', 'description', 'logo'],
            },
        }

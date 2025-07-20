# -*- coding: utf-8 -*-

from odoo import models, fields, api


class PosOrder(models.Model):
    _inherit = 'pos.order'

    custom_order_number = fields.Char(
        string='Custom Order Number',
        help='Custom order number that can be manually entered during order creation'
    )

    @api.model
    def _order_fields(self, ui_order):
        """Override to include custom_order_number in the order fields"""
        fields = super(PosOrder, self)._order_fields(ui_order)

        # Add custom_order_number if it exists in the UI order data
        if 'custom_order_number' in ui_order:
            fields['custom_order_number'] = ui_order['custom_order_number']

        return fields

    def _export_for_ui(self, order):
        """Override to include custom_order_number when exporting order data
        for UI (reprinting)"""
        result = super(PosOrder, self)._export_for_ui(order)
        if order.custom_order_number:
            result['custom_order_number'] = order.custom_order_number
        return result

# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError


class ProductBrand(models.Model):
    _name = 'product.brand'
    _description = 'Product Brand'

    name = fields.Char(string='Brand Name', required=True)
    description = fields.Text(string='Description')
    logo = fields.Binary(string='Brand Logo')

    @api.model
    def create(self, vals):
        if 'name' in vals and not vals['name'].strip():
            raise UserError("Brand name cannot be empty.")
        return super(ProductBrand, self).create(vals)

    def write(self, vals):
        if 'name' in vals and not vals['name'].strip():
            raise UserError("Brand name cannot be empty.")
        return super(ProductBrand, self).write(vals)

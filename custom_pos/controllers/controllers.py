# -*- coding: utf-8 -*-
# from odoo import http


# class PosTest(http.Controller):
#     @http.route('/pos_test/pos_test', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/pos_test/pos_test/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('pos_test.listing', {
#             'root': '/pos_test/pos_test',
#             'objects': http.request.env['pos_test.pos_test'].search([]),
#         })

#     @http.route('/pos_test/pos_test/objects/<model("pos_test.pos_test"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('pos_test.object', {
#             'object': obj
#         })


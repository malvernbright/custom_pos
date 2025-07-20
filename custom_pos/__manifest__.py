# -*- coding: utf-8 -*-
{
    'name': "pos tutorial",

    'summary': "Short (1 phrase/line) summary of the module's purpose",

    'description': """
Long description of module's purpose
    """,

    'author': "Bytesphere Technologies (Pvt) Ltd",
    'website': "https://bytesphere.co.zw",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/17.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': [
        'base',
        'point_of_sale',
        'sale_management',
        'stock',
        'account'],

    # always loaded
    "data": [
        "security/ir.model.access.csv",
        "views/product_brand_views.xml",
        "views/product_template_views.xml",
        "views/pos_order_views.xml",
    ],
    "demo": [
        "demo/demo.xml",
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            # js
            'custom_pos/static/src/js/pos_store.js',
            'custom_pos/static/src/js/orderline.js',
            'custom_pos/static/src/js/orderline_model.js',
            'custom_pos/static/src/js/order_model_extended.js',
            'custom_pos/static/src/js/custom_order_number_popup.js',
            'custom_pos/static/src/js/product_screen.js',
            # xml
            'custom_pos/static/src/xml/orderline.xml',
            'custom_pos/static/src/xml/receipt.xml',
            'custom_pos/static/src/xml/custom_order_number_popup.xml',
            'custom_pos/static/src/xml/product_screen.xml',
        ]
    }
}

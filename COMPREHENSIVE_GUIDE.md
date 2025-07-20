# Comprehensive Guide: Adding Custom Fields to Odoo 17 POS

## Table of Contents
1. [Overview](#overview)
2. [Project Setup](#project-setup)
3. [Adding Custom Fields to Products](#adding-custom-fields-to-products)
4. [Adding Custom Fields to Orders](#adding-custom-fields-to-orders)
5. [Frontend Implementation](#frontend-implementation)
6. [Receipt Customization](#receipt-customization)
7. [Testing and Troubleshooting](#testing-and-troubleshooting)

## Overview

This guide demonstrates how to:
- Add custom fields to product templates and POS orders
- Display custom product fields in POS interface
- Allow manual input of custom order fields via popups
- Show both product and order custom fields on receipts
- Ensure custom fields appear on both original and reprinted receipts

**Example Implementation**: Adding a "Brand" field to products and a "Custom Order Number" field to orders.

## Project Setup

### 1. Create Module Structure

```
custom_pos/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   ├── product_brand.py
│   ├── product_template.py
│   ├── pos_order.py
│   └── pos_session.py
├── views/
│   ├── product_brand_views.xml
│   ├── product_template_views.xml
│   └── pos_order_views.xml
├── security/
│   └── ir.model.access.csv
├── demo/
│   └── demo.xml
└── static/
    └── src/
        ├── js/
        │   ├── pos_store.js
        │   ├── orderline.js
        │   ├── orderline_model.js
        │   ├── order_model_extended.js
        │   ├── custom_order_number_popup.js
        │   └── product_screen.js
        └── xml/
            ├── orderline.xml
            ├── receipt.xml
            ├── custom_order_number_popup.xml
            └── product_screen.xml
```

### 2. Module Manifest (`__manifest__.py`)

```python
# -*- coding: utf-8 -*-
{
    'name': "POS Custom Fields Tutorial",
    'summary': "Add custom fields to products and orders in POS",
    'description': """
    This module demonstrates how to:
    - Add custom fields to products (brand)
    - Add custom fields to orders (custom order number)
    - Display them in POS interface
    - Show them on receipts
    """,
    'author': "Your Company",
    'website': "https://www.yourcompany.com",
    'category': 'Point of Sale',
    'version': '1.0',
    'depends': [
        'base',
        'point_of_sale',
        'sale_management',
        'stock',
        'account'
    ],
    'data': [
        "security/ir.model.access.csv",
        "views/product_brand_views.xml",
        "views/product_template_views.xml",
        "views/pos_order_views.xml",
    ],
    'demo': [
        "demo/demo.xml",
    ],
    'assets': {
        "point_of_sale._assets_pos": [
            # JavaScript files
            'custom_pos/static/src/js/pos_store.js',
            'custom_pos/static/src/js/orderline.js',
            'custom_pos/static/src/js/orderline_model.js',
            'custom_pos/static/src/js/order_model_extended.js',
            'custom_pos/static/src/js/custom_order_number_popup.js',
            'custom_pos/static/src/js/product_screen.js',
            # XML templates
            'custom_pos/static/src/xml/orderline.xml',
            'custom_pos/static/src/xml/receipt.xml',
            'custom_pos/static/src/xml/custom_order_number_popup.xml',
            'custom_pos/static/src/xml/product_screen.xml',
        ]
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
```

### 3. Module Initialization (`__init__.py`)

```python
# -*- coding: utf-8 -*-
from . import models
```

```python
# models/__init__.py
# -*- coding: utf-8 -*-
from . import product_brand
from . import product_template
from . import pos_session
from . import pos_order
```

## Adding Custom Fields to Products

### Step 1: Create Custom Model for Related Data

If your custom field references another model (like Brand), create it first:

```python
# models/product_brand.py
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class ProductBrand(models.Model):
    _name = 'product.brand'
    _description = 'Product Brand'
    _order = 'name'

    name = fields.Char(
        string='Brand Name',
        required=True,
        help='Name of the product brand'
    )
    
    description = fields.Text(
        string='Description',
        help='Brand description'
    )
    
    active = fields.Boolean(
        string='Active',
        default=True,
        help='Set to false to hide the brand without removing it'
    )
    
    # Optional: Add brand logo
    logo = fields.Image(
        string='Brand Logo',
        help='Brand logo image'
    )
    
    # Count products using this brand
    product_count = fields.Integer(
        string='Products Count',
        compute='_compute_product_count'
    )
    
    @api.depends('name')
    def _compute_product_count(self):
        for brand in self:
            brand.product_count = self.env['product.template'].search_count([
                ('brand_id', '=', brand.id)
            ])
```

### Step 2: Add Custom Field to Product Template

```python
# models/product_template.py
# -*- coding: utf-8 -*-
from odoo import models, fields

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Example 1: Reference to another model
    brand_id = fields.Many2one(
        'product.brand',
        string='Brand',
        help='Product brand'
    )
    
    # Example 2: Simple text field
    custom_code = fields.Char(
        string='Custom Product Code',
        help='Internal custom code for the product'
    )
    
    # Example 3: Selection field
    quality_grade = fields.Selection([
        ('premium', 'Premium'),
        ('standard', 'Standard'),
        ('economy', 'Economy'),
    ], string='Quality Grade', default='standard')
    
    # Example 4: Boolean field
    is_featured = fields.Boolean(
        string='Featured Product',
        default=False,
        help='Mark as featured product'
    )
```

### Step 3: Create Views for Custom Fields

```xml
<!-- views/product_brand_views.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>
        <!-- Brand Tree View -->
        <record id="view_product_brand_tree" model="ir.ui.view">
            <field name="name">product.brand.tree</field>
            <field name="model">product.brand</field>
            <field name="arch" type="xml">
                <tree>
                    <field name="name"/>
                    <field name="product_count"/>
                    <field name="active"/>
                </tree>
            </field>
        </record>

        <!-- Brand Form View -->
        <record id="view_product_brand_form" model="ir.ui.view">
            <field name="name">product.brand.form</field>
            <field name="model">product.brand</field>
            <field name="arch" type="xml">
                <form>
                    <sheet>
                        <div class="oe_button_box" name="button_box">
                            <button name="action_view_products" type="object"
                                    class="oe_stat_button" icon="fa-cube">
                                <field name="product_count" widget="statinfo" 
                                       string="Products"/>
                            </button>
                        </div>
                        
                        <field name="logo" widget="image" class="oe_avatar"/>
                        
                        <div class="oe_title">
                            <h1>
                                <field name="name" placeholder="Brand Name"/>
                            </h1>
                        </div>
                        
                        <group>
                            <field name="active"/>
                            <field name="description"/>
                        </group>
                    </sheet>
                </form>
            </field>
        </record>

        <!-- Brand Action -->
        <record id="action_product_brand" model="ir.actions.act_window">
            <field name="name">Product Brands</field>
            <field name="res_model">product.brand</field>
            <field name="view_mode">tree,form</field>
        </record>

        <!-- Menu Item -->
        <menuitem id="menu_product_brand"
                  name="Brands"
                  parent="sale.prod_config_main"
                  action="action_product_brand"
                  sequence="50"/>
    </data>
</odoo>
```

```xml
<!-- views/product_template_views.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>
        <!-- Add custom fields to product form -->
        <record id="view_product_template_form_custom" model="ir.ui.view">
            <field name="name">product.template.form.custom</field>
            <field name="model">product.template</field>
            <field name="inherit_id" ref="product.product_template_form_view"/>
            <field name="arch" type="xml">
                <!-- Add after the name field -->
                <xpath expr="//field[@name='name']" position="after">
                    <field name="brand_id"/>
                    <field name="custom_code"/>
                </xpath>
                
                <!-- Add to the General Information tab -->
                <xpath expr="//group[@name='group_general']" position="inside">
                    <field name="quality_grade"/>
                    <field name="is_featured"/>
                </xpath>
            </field>
        </record>

        <!-- Add custom fields to product tree view -->
        <record id="view_product_template_tree_custom" model="ir.ui.view">
            <field name="name">product.template.tree.custom</field>
            <field name="model">product.template</field>
            <field name="inherit_id" ref="product.product_template_tree_view"/>
            <field name="arch" type="xml">
                <xpath expr="//field[@name='name']" position="after">
                    <field name="brand_id" optional="show"/>
                    <field name="custom_code" optional="hide"/>
                </xpath>
            </field>
        </record>
    </data>
</odoo>
```

### Step 4: Enable POS Data Loading

```python
# models/pos_session.py
# -*- coding: utf-8 -*-
from odoo import models

class PosSession(models.Model):
    _inherit = 'pos.session'

    def _loader_params_product_brand(self):
        """Define which fields to load for product.brand model"""
        return {
            'search_params': {
                'domain': [('active', '=', True)],
                'fields': ['name', 'description', 'logo'],
            }
        }

    def _get_pos_ui_product_brand(self, params):
        """Load product.brand data for POS"""
        return self.env['product.brand'].search_read(**params['search_params'])

    def _loader_params_product_product(self):
        """Override to include custom fields in product loading"""
        result = super()._loader_params_product_product()
        # Add custom fields to the fields list
        result['search_params']['fields'].extend([
            'brand_id', 'custom_code', 'quality_grade', 'is_featured'
        ])
        return result

    def _pos_ui_models_to_load(self):
        """Add product.brand model to POS loading"""
        result = super()._pos_ui_models_to_load()
        result.append('product.brand')
        return result

    def _pos_ui_models_to_load(self):
        """Define models to load in POS"""
        result = super()._pos_ui_models_to_load()
        result.append('product.brand')
        return result
```

## Adding Custom Fields to Orders

### Step 1: Extend POS Order Model

```python
# models/pos_order.py
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosOrder(models.Model):
    _inherit = 'pos.order'

    # Example 1: Manual input field
    custom_order_number = fields.Char(
        string='Custom Order Number',
        help='Custom order number manually entered during order creation'
    )
    
    # Example 2: Selection field
    priority = fields.Selection([
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], string='Priority', default='normal')
    
    # Example 3: Text field
    special_instructions = fields.Text(
        string='Special Instructions',
        help='Special instructions for this order'
    )
    
    # Example 4: Date field
    requested_delivery_date = fields.Date(
        string='Requested Delivery Date',
        help='Customer requested delivery date'
    )

    @api.model
    def _order_fields(self, ui_order):
        """Override to include custom fields when creating orders from UI"""
        fields = super(PosOrder, self)._order_fields(ui_order)
        
        # Add custom fields if they exist in the UI order data
        custom_fields = [
            'custom_order_number', 'priority', 
            'special_instructions', 'requested_delivery_date'
        ]
        
        for field in custom_fields:
            if field in ui_order:
                fields[field] = ui_order[field]
        
        return fields

    def _export_for_ui(self, order):
        """Override to include custom fields when exporting for reprinting"""
        result = super(PosOrder, self)._export_for_ui(order)
        
        # Include custom fields in exported data
        custom_fields = [
            'custom_order_number', 'priority', 
            'special_instructions', 'requested_delivery_date'
        ]
        
        for field in custom_fields:
            if hasattr(order, field) and getattr(order, field):
                result[field] = getattr(order, field)
        
        return result
```

### Step 2: Create Order Views

```xml
<!-- views/pos_order_views.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data>
        <!-- Add custom fields to POS Order form view -->
        <record id="view_pos_order_form_custom" model="ir.ui.view">
            <field name="name">pos.order.form.custom</field>
            <field name="model">pos.order</field>
            <field name="inherit_id" ref="point_of_sale.view_pos_pos_form"/>
            <field name="arch" type="xml">
                <xpath expr="//field[@name='name']" position="after">
                    <field name="custom_order_number"/>
                    <field name="priority"/>
                </xpath>
                
                <xpath expr="//group[@name='order_fields']" position="after">
                    <group string="Custom Information" colspan="2">
                        <field name="requested_delivery_date"/>
                        <field name="special_instructions" colspan="2"/>
                    </group>
                </xpath>
            </field>
        </record>

        <!-- Add custom fields to POS Order tree view -->
        <record id="view_pos_order_tree_custom" model="ir.ui.view">
            <field name="name">pos.order.tree.custom</field>
            <field name="model">pos.order</field>
            <field name="inherit_id" ref="point_of_sale.view_pos_order_tree"/>
            <field name="arch" type="xml">
                <xpath expr="//field[@name='name']" position="after">
                    <field name="custom_order_number" optional="show"/>
                    <field name="priority" optional="hide"/>
                </xpath>
            </field>
        </record>
    </data>
</odoo>
```

## Frontend Implementation

### Step 1: Enhance POS Store

```javascript
// static/src/js/pos_store.js
/** @odoo-module */

import { PosStore } from "@point_of_sale/app/store/pos_store";
import { patch } from "@web/core/utils/patch";

patch(PosStore.prototype, {
    async _processData(loadedData) {
        await super._processData(...arguments);
        
        // Store brand data
        this.brands_by_id = {};
        if (loadedData['product.brand']) {
            loadedData['product.brand'].forEach(brand => {
                this.brands_by_id[brand.id] = brand;
            });
        }
    },

    // Helper method to get brand by ID
    get_product_brand_by_id(brand_id) {
        return this.brands_by_id[brand_id] || null;
    },

    // Helper method to get all brands
    get_all_brands() {
        return Object.values(this.brands_by_id);
    }
});
```

### Step 2: Enhance Order Model

```javascript
// static/src/js/order_model_extended.js
/** @odoo-module */

import { Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Order.prototype, {
    init_from_JSON(json) {
        super.init_from_JSON(json);
        
        // Initialize custom order fields
        this.custom_order_number = json.custom_order_number || '';
        this.priority = json.priority || 'normal';
        this.special_instructions = json.special_instructions || '';
        this.requested_delivery_date = json.requested_delivery_date || null;
    },

    export_as_JSON() {
        const json = super.export_as_JSON();
        
        // Include custom fields in JSON export
        json.custom_order_number = this.custom_order_number || '';
        json.priority = this.priority || 'normal';
        json.special_instructions = this.special_instructions || '';
        json.requested_delivery_date = this.requested_delivery_date || null;
        
        return json;
    },

    // Setter methods for custom fields
    set_custom_order_number(custom_order_number) {
        this.custom_order_number = custom_order_number;
    },

    set_priority(priority) {
        this.priority = priority;
    },

    set_special_instructions(instructions) {
        this.special_instructions = instructions;
    },

    set_requested_delivery_date(date) {
        this.requested_delivery_date = date;
    },

    // Getter methods for custom fields
    get_custom_order_number() {
        return this.custom_order_number || '';
    },

    get_priority() {
        return this.priority || 'normal';
    },

    get_special_instructions() {
        return this.special_instructions || '';
    },

    get_requested_delivery_date() {
        return this.requested_delivery_date || null;
    },

    export_for_printing() {
        const result = super.export_for_printing();
        
        // Include custom fields in receipt data
        result.custom_order_number = this.custom_order_number || '';
        result.priority = this.priority || 'normal';
        result.special_instructions = this.special_instructions || '';
        result.requested_delivery_date = this.requested_delivery_date || null;

        // Enhance orderlines with brand information
        if (result.orderlines) {
            result.orderlines = result.orderlines.map(line => {
                const orderLine = this.orderlines.find(ol =>
                    ol.get_product().id === line.product_id
                );

                if (orderLine && orderLine.get_product().brand_id) {
                    const product = orderLine.get_product();
                    if (Array.isArray(product.brand_id)) {
                        line.brand_name = product.brand_id[1];
                        line.brand_id = {
                            id: product.brand_id[0],
                            name: product.brand_id[1]
                        };
                    }
                    
                    // Add other custom product fields
                    line.custom_code = product.custom_code || '';
                    line.quality_grade = product.quality_grade || '';
                    line.is_featured = product.is_featured || false;
                }

                return line;
            });
        }

        return result;
    }
});
```

### Step 3: Create Input Popup

```javascript
// static/src/js/custom_order_number_popup.js
/** @odoo-module */

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { useState, useRef, onMounted } from "@odoo/owl";

export class CustomOrderNumberPopup extends AbstractAwaitablePopup {
    static template = "custom_pos.CustomOrderNumberPopup";
    static defaultProps = {
        confirmText: _t('Confirm'),
        cancelText: _t('Cancel'),
        title: _t('Set Custom Order Number'),
        body: _t('Enter a custom order number for this order:'),
        startingValue: "",
    };

    setup() {
        super.setup();
        this.state = useState({ 
            inputValue: this.props.startingValue || '' 
        });
        this.inputRef = useRef("input");
        onMounted(this.onMounted);
    }

    onMounted() {
        this.inputRef.el.focus();
    }

    getPayload() {
        return this.state.inputValue;
    }
}
```

### Step 4: Enhance Product Screen

```javascript
// static/src/js/product_screen.js
/** @odoo-module */

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { patch } from "@web/core/utils/patch";
import { CustomOrderNumberPopup } from "@custom_pos/js/custom_order_number_popup";

patch(ProductScreen.prototype, {
    async setCustomOrderNumber() {
        const currentOrder = this.pos.get_order();
        const currentCustomNumber = currentOrder.get_custom_order_number();
        
        const { confirmed, payload } = await this.popup.add(CustomOrderNumberPopup, {
            startingValue: currentCustomNumber,
        });
        
        if (confirmed) {
            currentOrder.set_custom_order_number(payload);
        }
    },

    // Additional method for setting other custom fields
    async setOrderPriority() {
        // Implementation for priority selection popup
    }
});
```

### Step 5: Enhance Orderline Display

```javascript
// static/src/js/orderline.js
/** @odoo-module */

import { Orderline } from "@point_of_sale/app/generic_components/orderline";
import { patch } from "@web/core/utils/patch";

patch(Orderline.prototype, {
    get brandName() {
        try {
            const product = this.props.line.get_product();
            if (product.brand_id && Array.isArray(product.brand_id)) {
                return product.brand_id[1]; // brand name
            }
            return '';
        } catch (error) {
            console.warn('Error getting brand name:', error);
            return '';
        }
    },

    get customCode() {
        try {
            const product = this.props.line.get_product();
            return product.custom_code || '';
        } catch (error) {
            return '';
        }
    },

    get qualityGrade() {
        try {
            const product = this.props.line.get_product();
            return product.quality_grade || '';
        } catch (error) {
            return '';
        }
    }
});
```

## Receipt Customization

### Step 1: Create Custom Receipt Template

```xml
<!-- static/src/xml/receipt.xml -->
<?xml version="1.0" encoding="utf-8"?>
<templates id="template" xml:space="preserve">
    <t t-name="point_of_sale.OrderReceipt" t-inherit="point_of_sale.OrderReceipt" t-inherit-mode="extension">
        <!-- Add custom order fields after the order reference -->
        <xpath expr="//div[hasclass('pos-receipt-order-data')]" position="inside">
            <!-- Custom Order Number -->
            <t t-if="props.data.custom_order_number">
                <div class="pos-receipt-custom-order-number" style="font-weight: bold; margin-bottom: 5px;">
                    Custom Order #: <t t-esc="props.data.custom_order_number"/>
                </div>
            </t>
            
            <!-- Priority -->
            <t t-if="props.data.priority and props.data.priority != 'normal'">
                <div class="pos-receipt-priority" style="margin-bottom: 5px;">
                    Priority: <t t-esc="props.data.priority.toUpperCase()"/>
                </div>
            </t>
            
            <!-- Delivery Date -->
            <t t-if="props.data.requested_delivery_date">
                <div class="pos-receipt-delivery-date" style="margin-bottom: 5px;">
                    Delivery Date: <t t-esc="props.data.requested_delivery_date"/>
                </div>
            </t>
            
            <!-- Special Instructions -->
            <t t-if="props.data.special_instructions">
                <div class="pos-receipt-instructions" style="margin-bottom: 10px; font-style: italic;">
                    Instructions: <t t-esc="props.data.special_instructions"/>
                </div>
            </t>
        </xpath>
        
        <!-- Replace orderlines section to show custom product fields -->
        <xpath expr="//OrderWidget" position="replace">
            <div class="orderlines">
                <t t-foreach="props.data.orderlines" t-as="line" t-key="line_index">
                    <div class="pos-receipt-orderline">
                        <!-- Quantity and Product Name -->
                        <div class="pos-receipt-left-align">
                            <t t-esc="line.qty"/>
                            <t t-if="line.unit !== 'Units'">
                                <t t-esc="line.unit"/>
                            </t>
                            x <t t-esc="line.productName"/>
                            
                            <!-- Brand Information -->
                            <t t-if="line.brand_name">
                                <span style="color: #666; font-style: italic;"> (<t t-esc="line.brand_name"/>)</span>
                            </t>
                            
                            <!-- Custom Code -->
                            <t t-if="line.custom_code">
                                <br/><span style="font-size: 0.8em; color: #666;">Code: <t t-esc="line.custom_code"/></span>
                            </t>
                            
                            <!-- Quality Grade -->
                            <t t-if="line.quality_grade and line.quality_grade != 'standard'">
                                <br/><span style="font-size: 0.8em; color: #666;">Grade: <t t-esc="line.quality_grade"/></span>
                            </t>
                            
                            <!-- Featured Badge -->
                            <t t-if="line.is_featured">
                                <span style="background: gold; color: black; padding: 2px 4px; font-size: 0.7em; border-radius: 3px; margin-left: 5px;">FEATURED</span>
                            </t>
                        </div>
                        
                        <!-- Price -->
                        <div class="pos-receipt-right-align">
                            <t t-esc="line.price"/>
                        </div>
                        
                        <!-- Customer Note -->
                        <t t-if="line.customerNote">
                            <div class="pos-receipt-orderline-note" style="margin-left: 20px; font-size: 0.9em; color: #666;">
                                Note: <t t-esc="line.customerNote"/>
                            </div>
                        </t>
                    </div>
                </t>
            </div>
        </xpath>
    </t>
</templates>
```

### Step 2: Create Popup Templates

```xml
<!-- static/src/xml/custom_order_number_popup.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<templates id="template" xml:space="preserve">
    <t t-name="custom_pos.CustomOrderNumberPopup">
        <div class="popup custom-order-number-popup">
            <div class="popup-header">
                <p class="title" t-esc="props.title"/>
            </div>
            <main class="popup-body">
                <p t-esc="props.body"/>
                <input 
                    t-ref="input"
                    type="text" 
                    class="form-control" 
                    t-model="state.inputValue" 
                    placeholder="Enter custom order number..."/>
            </main>
            <footer class="popup-footer">
                <div class="button cancel" t-on-click="cancel">
                    <t t-esc="props.cancelText"/>
                </div>
                <div class="button confirm highlight" t-on-click="confirm">
                    <t t-esc="props.confirmText"/>
                </div>
            </footer>
        </div>
    </t>
</templates>
```

### Step 3: Add UI Buttons

```xml
<!-- static/src/xml/product_screen.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<templates id="template" xml:space="preserve">
    <t t-name="custom_pos.ProductScreenCustomButton" t-inherit="point_of_sale.ProductScreen" t-inherit-mode="extension">
        <xpath expr="//div[hasclass('control-buttons')]" position="inside">
            <button class="control-button" t-on-click="setCustomOrderNumber">
                <i class="fa fa-hashtag"/>
                Custom Order #
            </button>
        </xpath>
    </t>
</templates>
```

### Step 4: Enhance Orderline Template

```xml
<!-- static/src/xml/orderline.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<templates id="template" xml:space="preserve">
    <t t-name="point_of_sale.Orderline" t-inherit="point_of_sale.Orderline" t-inherit-mode="extension">
        <xpath expr="//span[@class='product-name']" position="after">
            <t t-if="brandName">
                <br/><span class="brand-name" style="font-size: 0.9em; color: #666; font-style: italic;">
                    <t t-esc="brandName"/>
                </span>
            </t>
            <t t-if="customCode">
                <br/><span class="custom-code" style="font-size: 0.8em; color: #999;">
                    Code: <t t-esc="customCode"/>
                </span>
            </t>
        </xpath>
    </t>
</templates>
```

## Security Configuration

```csv
# security/ir.model.access.csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_product_brand_user,product_brand_user,model_product_brand,base.group_user,1,0,0,0
access_product_brand_manager,product_brand_manager,model_product_brand,sales_team.group_sale_manager,1,1,1,1
access_product_brand_pos_user,product_brand_pos_user,model_product_brand,point_of_sale.group_pos_user,1,0,0,0
```

## Demo Data

```xml
<!-- demo/demo.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <!-- Demo Brands -->
        <record id="brand_apple" model="product.brand">
            <field name="name">Apple</field>
            <field name="description">Apple Inc. technology products</field>
        </record>
        
        <record id="brand_samsung" model="product.brand">
            <field name="name">Samsung</field>
            <field name="description">Samsung Electronics products</field>
        </record>
        
        <record id="brand_google" model="product.brand">
            <field name="name">Google</field>
            <field name="description">Google hardware products</field>
        </record>

        <!-- Demo Products with Custom Fields -->
        <record id="product_iphone_15_pro" model="product.template">
            <field name="name">iPhone 15 Pro</field>
            <field name="brand_id" ref="brand_apple"/>
            <field name="custom_code">APL-IP15P-256</field>
            <field name="quality_grade">premium</field>
            <field name="is_featured">True</field>
            <field name="list_price">999.00</field>
            <field name="available_in_pos">True</field>
        </record>
        
        <record id="product_galaxy_s24" model="product.template">
            <field name="name">Galaxy S24</field>
            <field name="brand_id" ref="brand_samsung"/>
            <field name="custom_code">SAM-GS24-128</field>
            <field name="quality_grade">premium</field>
            <field name="is_featured">True</field>
            <field name="list_price">899.00</field>
            <field name="available_in_pos">True</field>
        </record>
        
        <record id="product_pixel_8" model="product.template">
            <field name="name">Pixel 8</field>
            <field name="brand_id" ref="brand_google"/>
            <field name="custom_code">GOO-PIX8-256</field>
            <field name="quality_grade">standard</field>
            <field name="is_featured">False</field>
            <field name="list_price">699.00</field>
            <field name="available_in_pos">True</field>
        </record>
    </data>
</odoo>
```

## Testing and Troubleshooting

### Testing Checklist

#### Backend Testing:
1. **Models Creation**:
   - [ ] Install module successfully
   - [ ] Create new brands via Sales > Configuration > Brands
   - [ ] Add custom fields to products
   - [ ] View custom fields in product forms

2. **Data Persistence**:
   - [ ] Custom fields save correctly
   - [ ] Custom fields appear in list views
   - [ ] Search and filter work with custom fields

#### Frontend Testing:
1. **POS Loading**:
   - [ ] POS loads without errors
   - [ ] Custom fields data is available in browser console
   - [ ] Brand information appears in orderlines

2. **Order Creation**:
   - [ ] Custom order number popup works
   - [ ] Custom order number saves to order
   - [ ] Custom fields appear on receipts

3. **Reprinting**:
   - [ ] Access Orders screen (ticket icon)
   - [ ] Switch to "SYNCED" filter
   - [ ] Select order and reprint
   - [ ] Custom fields appear on reprinted receipts

### Common Issues and Solutions

#### Issue 1: "Model not found" error
**Solution**: Ensure model is properly imported in `__init__.py` files

#### Issue 2: Fields not appearing in POS
**Solution**: Check `_loader_params_*` methods in `pos_session.py`

#### Issue 3: JavaScript errors
**Solution**: 
- Check browser console for errors
- Verify all imports are correct
- Ensure proper patching syntax

#### Issue 4: Custom fields not saving
**Solution**: Verify `_order_fields` method includes your custom fields

#### Issue 5: Receipt not showing custom data
**Solution**: Check `export_for_printing` method includes custom fields

### Debugging Tips

1. **Enable Developer Mode**: Add `?debug=1` to URL
2. **Check Browser Console**: Look for JavaScript errors
3. **Verify Data Loading**: Use browser console to check `this.pos.brands_by_id`
4. **Test Backend First**: Ensure custom fields work in backend before frontend
5. **Check Asset Loading**: Verify all JS/XML files are listed in manifest

### Performance Considerations

1. **Limit Data Loading**: Only load necessary fields in POS
2. **Optimize Queries**: Use proper domains in loader methods
3. **Cache Data**: Store frequently accessed data in POS store
4. **Minimize Receipt Complexity**: Keep receipt templates simple

This comprehensive guide provides a complete framework for adding custom fields to both products and orders in Odoo 17 POS, with full frontend integration and receipt customization.

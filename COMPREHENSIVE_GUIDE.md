# Comprehensive Guide: Adding Custom Fields to Odoo 17 POS
## Complete Implementation with Code Explanations

## Table of Contents
1. [Overview](#overview)
2. [Project Setup](#project-setup)
3. [Adding Custom Fields to Products](#adding-custom-fields-to-products)
4. [Adding Custom Fields to Orders](#adding-custom-fields-to-orders)
5. [Frontend Implementation](#frontend-implementation)
6. [Receipt Customization](#receipt-customization)
7. [Testing and Troubleshooting](#testing-and-troubleshooting)
8. [Code Explanation Reference](#code-explanation-reference)

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
    # WHY: _name defines the database table name (product_brand)
    # PURPOSE: Creates a new model to store brand information separately
    _name = 'product.brand'
    
    # WHY: _description provides human-readable model description
    # PURPOSE: Used in logs, error messages, and model documentation
    _description = 'Product Brand'
    
    # WHY: _order defines default sorting when fetching records
    # PURPOSE: Brands will be listed alphabetically by name
    _order = 'name'

    # WHY: Char field for storing brand name as text
    # PURPOSE: Main identifier for the brand, required for data integrity
    name = fields.Char(
        string='Brand Name',           # Label shown in UI forms
        required=True,                 # Cannot be empty - data validation
        help='Name of the product brand'  # Tooltip text in forms
    )
    
    # WHY: Text field allows longer descriptions than Char
    # PURPOSE: Store detailed brand information with unlimited length
    description = fields.Text(
        string='Description',
        help='Brand description'
    )
    
    # WHY: Boolean field for soft deletion (hide instead of delete)
    # PURPOSE: Allows hiding brands without losing historical data
    active = fields.Boolean(
        string='Active',
        default=True,                  # New brands are active by default
        help='Set to false to hide the brand without removing it'
    )
    
    # WHY: Image field for storing brand logo as binary data
    # PURPOSE: Visual representation of brand in forms and reports
    logo = fields.Image(
        string='Brand Logo',
        help='Brand logo image'
    )
    
    # WHY: Computed field automatically calculates value
    # PURPOSE: Shows how many products use this brand (useful statistics)
    product_count = fields.Integer(
        string='Products Count',
        compute='_compute_product_count'  # Method that calculates the value
    )
    
    # WHY: @api.depends decorator defines when to recalculate computed fields
    # PURPOSE: Recalculates product_count when brand name changes
    @api.depends('name')
    def _compute_product_count(self):
        # WHY: Loop through each brand record in the current recordset
        # PURPOSE: Calculate product count for each brand individually
        for brand in self:
            # WHY: search_count is more efficient than search + len()
            # PURPOSE: Count products linked to this brand without loading all records
            brand.product_count = self.env['product.template'].search_count([
                ('brand_id', '=', brand.id)  # Filter: products with this brand
            ])
```

**Code Explanation:**

1. **Model Definition (`_name`, `_description`, `_order`)**:
   - `_name`: Creates the database table and defines the model identifier
   - `_description`: Human-readable description for documentation and error messages
   - `_order`: Default sorting prevents random order when displaying brands

2. **Field Types Selection**:
   - `Char`: For short text (brand names) with length limitations
   - `Text`: For longer descriptions without length restrictions
   - `Boolean`: For true/false values (active/inactive status)
   - `Image`: For binary image data with automatic resizing

3. **Field Attributes**:
   - `required=True`: Database constraint ensuring data integrity
   - `default=True`: Saves time by pre-filling common values
   - `help`: Provides user guidance in the interface

4. **Computed Fields**:
   - Automatically calculated based on other data
   - `@api.depends`: Tells Odoo when to recalculate
   - More efficient than manual counting in every view

### Step 2: Add Custom Field to Product Template

```python
# models/product_template.py
# -*- coding: utf-8 -*-
from odoo import models, fields

class ProductTemplate(models.Model):
    # WHY: _inherit extends existing model without creating new table
    # PURPOSE: Add custom fields to existing product.template model
    _inherit = 'product.template'

    # Example 1: Reference to another model
    # WHY: Many2one creates foreign key relationship to product.brand
    # PURPOSE: Links each product to a brand, enabling brand-based filtering/reporting
    brand_id = fields.Many2one(
        'product.brand',              # Target model to link to
        string='Brand',               # Label in forms and views
        help='Product brand'          # Tooltip for users
    )
    
    # Example 2: Simple text field
    # WHY: Char field for short text data with character limit
    # PURPOSE: Store internal product codes for inventory management
    custom_code = fields.Char(
        string='Custom Product Code',
        help='Internal custom code for the product'
    )
    
    # Example 3: Selection field
    # WHY: Selection provides dropdown with predefined options
    # PURPOSE: Standardized quality categories for reporting and pricing
    quality_grade = fields.Selection([
        ('premium', 'Premium'),       # (stored_value, display_label)
        ('standard', 'Standard'),
        ('economy', 'Economy'),
    ], string='Quality Grade', 
       default='standard'            # Default value for new products
    )
    
    # Example 4: Boolean field
    # WHY: Boolean for true/false flags (featured/not featured)
    # PURPOSE: Mark special products for promotional displays
    is_featured = fields.Boolean(
        string='Featured Product',
        default=False,                # Most products are not featured by default
        help='Mark as featured product'
    )
```

**Code Explanation:**

1. **Model Inheritance (`_inherit`)**:
   - Extends existing `product.template` model without creating new table
   - Adds fields to existing database table `product_template`
   - Preserves all existing functionality while adding custom features

2. **Field Type Selection Rationale**:
   - **Many2one**: Creates relational link to brands table, enables joins and filtering
   - **Char**: Limited text for codes/IDs that don't need paragraphs
   - **Selection**: Dropdown with fixed options prevents data inconsistency
   - **Boolean**: Simple checkbox for binary states (yes/no, true/false)

3. **Why These Specific Fields**:
   - `brand_id`: Enables brand-based product categorization and receipt display
   - `custom_code`: Internal tracking separate from barcode/default_code
   - `quality_grade`: Pricing tiers and customer expectations management
   - `is_featured`: Marketing and promotional product highlighting

4. **Default Values Strategy**:
   - `default='standard'`: Most products are standard quality
   - `default=False`: Most products are not featured (featured is special status)

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
    # WHY: Inherit pos.session to control what data loads into POS interface
    # PURPOSE: POS runs in browser and needs specific data preloaded for offline operation
    _inherit = 'pos.session'

    # WHY: Define parameters for loading product.brand model data
    # PURPOSE: Tells POS system what brand fields to load and what filters to apply
    def _loader_params_product_brand(self):
        """Define which fields to load for product.brand model"""
        return {
            'search_params': {
                # WHY: Only load active brands to avoid cluttering POS with inactive data
                # PURPOSE: Filters out disabled brands to keep interface clean
                'domain': [('active', '=', True)],
                
                # WHY: Specify only needed fields to minimize data transfer
                # PURPOSE: Reduces memory usage and loading time in browser
                'fields': ['name', 'description', 'logo'],
            }
        }

    # WHY: Method that actually loads brand data for POS
    # PURPOSE: Executes the search with parameters defined above
    def _get_pos_ui_product_brand(self, params):
        """Load product.brand data for POS"""
        # WHY: search_read combines search + read operations for efficiency
        # PURPOSE: Returns list of brand dictionaries with specified fields
        return self.env['product.brand'].search_read(**params['search_params'])

    # WHY: Override existing product loading to include custom fields
    # PURPOSE: Add our custom product fields to standard POS product loading
    def _loader_params_product_product(self):
        """Override to include custom fields in product loading"""
        # WHY: Call parent method to get standard product loading configuration
        # PURPOSE: Preserve existing functionality while adding custom fields
        result = super()._loader_params_product_product()
        
        # WHY: Extend the fields list with our custom product fields
        # PURPOSE: Ensures custom fields are available in POS interface
        result['search_params']['fields'].extend([
            'brand_id', 'custom_code', 'quality_grade', 'is_featured'
        ])
        return result

    # WHY: Tell POS system which models to load during startup
    # PURPOSE: Add product.brand to the list of models loaded into POS
    def _pos_ui_models_to_load(self):
        """Add product.brand model to POS loading"""
        # WHY: Get the standard list of models POS loads
        # PURPOSE: Preserve standard POS functionality
        result = super()._pos_ui_models_to_load()
        
        # WHY: Add our custom model to the loading list
        # PURPOSE: Ensures brand data is available in POS browser interface
        result.append('product.brand')
        return result
```

**Code Explanation:**

1. **POS Data Loading Architecture**:
   - POS runs in browser and needs data preloaded for offline operation
   - `pos.session` controls what data gets sent to browser during POS startup
   - Each model needs specific loader methods to define what data to send

2. **Loading Parameter Methods (`_loader_params_*`)**:
   - Define search domains (filters) for what records to load
   - Specify field lists to minimize data transfer size
   - Configure sorting and limits for performance

3. **Data Fetching Methods (`_get_pos_ui_*`)**:
   - Execute the actual database queries using defined parameters
   - Return data in format expected by POS frontend
   - Handle any data transformation needed

4. **Model Registration (`_pos_ui_models_to_load`)**:
   - Tells POS which models to load during startup
   - Each model in this list needs corresponding loader methods
   - Order matters - dependencies should load first

5. **Field Extension Strategy**:
   - Override existing product loader to add custom fields
   - Preserves all standard product functionality
   - Extends rather than replaces standard field list

6. **Performance Considerations**:
   - Only load active brands (reduces data size)
   - Only load necessary fields (faster transfer)
   - Use search_read for efficiency (single database operation)

## Adding Custom Fields to Orders

### Step 1: Extend POS Order Model

```python
# models/pos_order.py
# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosOrder(models.Model):
    # WHY: Inherit existing pos.order model to add custom fields
    # PURPOSE: Extend order functionality without breaking existing POS system
    _inherit = 'pos.order'

    # Example 1: Manual input field
    # WHY: Char field for custom order numbering system
    # PURPOSE: Allow manual order numbers separate from automatic sequence
    custom_order_number = fields.Char(
        string='Custom Order Number',
        help='Custom order number manually entered during order creation'
    )
    
    # Example 2: Selection field
    # WHY: Selection for standardized priority levels
    # PURPOSE: Enable order prioritization for kitchen/fulfillment workflow
    priority = fields.Selection([
        ('low', 'Low'),               # (stored_value, display_label)
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], string='Priority', 
       default='normal'              # Most orders have normal priority
    )
    
    # Example 3: Text field
    # WHY: Text field for unlimited-length instructions
    # PURPOSE: Store detailed customer requests or special handling notes
    special_instructions = fields.Text(
        string='Special Instructions',
        help='Special instructions for this order'
    )
    
    # Example 4: Date field
    # WHY: Date field for delivery scheduling
    # PURPOSE: Track when customer wants order delivered/ready
    requested_delivery_date = fields.Date(
        string='Requested Delivery Date',
        help='Customer requested delivery date'
    )

    # WHY: Override _order_fields to handle custom fields from POS interface
    # PURPOSE: When POS sends order data to backend, include custom fields
    @api.model
    def _order_fields(self, ui_order):
        """Override to include custom fields when creating orders from UI"""
        # WHY: Get standard order fields from parent method
        # PURPOSE: Preserve all existing order field handling
        fields = super(PosOrder, self)._order_fields(ui_order)
        
        # WHY: List all custom fields we want to save from POS interface
        # PURPOSE: Centralized list makes it easy to add/remove custom fields
        custom_fields = [
            'custom_order_number', 'priority', 
            'special_instructions', 'requested_delivery_date'
        ]
        
        # WHY: Check if each custom field exists in UI data before saving
        # PURPOSE: Avoid errors if POS sends partial data or field is missing
        for field in custom_fields:
            if field in ui_order:
                fields[field] = ui_order[field]
        
        return fields

    # WHY: Override _export_for_ui to include custom fields in reprint data
    # PURPOSE: When reprinting receipts, ensure custom fields are available
    def _export_for_ui(self, order):
        """Override to include custom fields when exporting for reprinting"""
        # WHY: Get standard export data from parent method
        # PURPOSE: Preserve all existing receipt data while adding custom fields
        result = super(PosOrder, self)._export_for_ui(order)
        
        # WHY: Same custom fields list for consistency
        # PURPOSE: Ensure reprint has same data as original receipt
        custom_fields = [
            'custom_order_number', 'priority', 
            'special_instructions', 'requested_delivery_date'
        ]
        
        # WHY: Check if field exists and has value before including
        # PURPOSE: Avoid None values or errors in receipt template
        for field in custom_fields:
            if hasattr(order, field) and getattr(order, field):
                result[field] = getattr(order, field)
        
        return result
```

**Code Explanation:**

1. **Model Inheritance Strategy**:
   - `_inherit = 'pos.order'`: Extends existing POS order model
   - Adds fields to existing `pos_order` database table
   - Preserves all standard POS order functionality

2. **Custom Field Design Decisions**:
   - **`custom_order_number`**: Char field for manual numbering (vs automatic sequences)
   - **`priority`**: Selection field with predefined options (prevents typos)
   - **`special_instructions`**: Text field for unlimited length (vs Char limitation)
   - **`requested_delivery_date`**: Date field for scheduling (not DateTime to keep simple)

3. **Data Flow Methods**:
   - **`_order_fields()`**: Called when POS creates order in database
   - **`_export_for_ui()`**: Called when loading order data for reprinting
   - Both methods ensure custom fields are properly handled in both directions

4. **Error Prevention Strategies**:
   - Check `if field in ui_order` before accessing (prevents KeyError)
   - Check `hasattr()` and `getattr()` before accessing (prevents AttributeError)
   - Use lists for field management (easier to maintain)

5. **Why Override These Specific Methods**:
   - `_order_fields()`: POS → Backend data flow (order creation)
   - `_export_for_ui()`: Backend → POS data flow (reprinting)
   - These are the standard Odoo hooks for POS-backend communication

6. **Default Value Strategy**:
   - `default='normal'`: Most orders have normal priority
   - No defaults for optional fields (custom_order_number, dates, instructions)

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
    // WHY: Override init_from_JSON to handle custom fields when loading saved orders
    // PURPOSE: When POS loads existing orders from database, initialize custom fields
    init_from_JSON(json) {
        // WHY: Call parent method first to handle standard order initialization
        // PURPOSE: Preserve all existing order loading functionality
        super.init_from_JSON(json);
        
        // WHY: Initialize custom_order_number from JSON data or empty string
        // PURPOSE: Ensure field exists even if not present in saved data (prevents undefined errors)
        this.custom_order_number = json.custom_order_number || '';
        
        // WHY: Initialize all other custom fields with default values
        // PURPOSE: Consistent field availability across all order objects
        this.priority = json.priority || 'normal';
        this.special_instructions = json.special_instructions || '';
        this.requested_delivery_date = json.requested_delivery_date || null;
    },

    // WHY: Override export_as_JSON to include custom fields when saving orders
    // PURPOSE: When POS saves orders to database, include our custom field data
    export_as_JSON() {
        // WHY: Get standard order JSON from parent method
        // PURPOSE: Preserve all existing order export functionality
        const json = super.export_as_JSON();
        
        // WHY: Add custom fields to JSON export
        // PURPOSE: Ensure custom fields are saved to database via _order_fields method
        json.custom_order_number = this.custom_order_number || '';
        json.priority = this.priority || 'normal';
        json.special_instructions = this.special_instructions || '';
        json.requested_delivery_date = this.requested_delivery_date || null;
        
        return json;
    },

    // WHY: Setter method for custom_order_number field
    // PURPOSE: Provides clean API for updating custom order number from UI components
    set_custom_order_number(custom_order_number) {
        this.custom_order_number = custom_order_number;
    },

    // WHY: Setter method for priority field
    // PURPOSE: Allows UI components to update order priority
    set_priority(priority) {
        this.priority = priority;
    },

    // WHY: Setter method for special instructions
    // PURPOSE: Enables UI to set customer instructions on order
    set_special_instructions(instructions) {
        this.special_instructions = instructions;
    },

    // WHY: Setter method for delivery date
    // PURPOSE: Allows UI to set requested delivery date
    set_requested_delivery_date(date) {
        this.requested_delivery_date = date;
    },

    // WHY: Getter method for custom_order_number
    // PURPOSE: Provides clean API for UI components to read custom order number
    get_custom_order_number() {
        return this.custom_order_number || '';
    },

    // WHY: Getter method for priority
    // PURPOSE: Allows UI components to display current priority
    get_priority() {
        return this.priority || 'normal';
    },

    // WHY: Getter method for special instructions
    // PURPOSE: Enables UI to display customer instructions
    get_special_instructions() {
        return this.special_instructions || '';
    },

    // WHY: Getter method for delivery date
    // PURPOSE: Allows UI to display requested delivery date
    get_requested_delivery_date() {
        return this.requested_delivery_date || null;
    },

    // WHY: Handle data from backend when loading orders for reprinting
    // PURPOSE: When reprinting receipts, initialize order with backend data
    init_from_ui_order_data(order_data) {
        // WHY: Call parent method if it exists (some versions may not have it)
        // PURPOSE: Handle standard order data loading from backend
        if (super.init_from_ui_order_data) {
            super.init_from_ui_order_data(order_data);
        }
        
        // WHY: Set custom fields from backend order data if available
        // PURPOSE: Ensure reprinted receipts show custom order number
        if (order_data.custom_order_number) {
            this.custom_order_number = order_data.custom_order_number;
        }
        // Additional custom fields can be handled here
        if (order_data.priority) {
            this.priority = order_data.priority;
        }
        if (order_data.special_instructions) {
            this.special_instructions = order_data.special_instructions;
        }
        if (order_data.requested_delivery_date) {
            this.requested_delivery_date = order_data.requested_delivery_date;
        }
    },

    // WHY: Override export_for_printing to include custom fields in receipt data
    // PURPOSE: When generating receipts, ensure all custom data is available to templates
    export_for_printing() {
        // WHY: Get standard receipt data from parent method
        // PURPOSE: Preserve all existing receipt functionality (totals, items, etc.)
        const result = super.export_for_printing();
        
        // WHY: Add custom order fields to receipt data
        // PURPOSE: Make custom fields available in receipt templates
        result.custom_order_number = this.custom_order_number || '';
        result.priority = this.priority || 'normal';
        result.special_instructions = this.special_instructions || '';
        result.requested_delivery_date = this.requested_delivery_date || null;

        // WHY: Enhance orderlines with brand information for receipt display
        // PURPOSE: Add brand data to each product line for receipt template
        if (result.orderlines) {
            result.orderlines = result.orderlines.map(line => {
                // WHY: Find the original orderline object to get product information
                // PURPOSE: Access full product data including brand relationship
                const orderLine = this.orderlines.find(ol =>
                    ol.get_product().id === line.product_id ||
                    ol.get_full_product_name() === line.productName
                );

                if (orderLine && orderLine.get_product().brand_id) {
                    const product = orderLine.get_product();
                    
                    // WHY: Check if brand_id is array format [id, name]
                    // PURPOSE: Odoo Many2one fields come as [id, name] arrays
                    if (Array.isArray(product.brand_id)) {
                        line.brand_id = {
                            id: product.brand_id[0],    // Extract brand ID
                            name: product.brand_id[1]   // Extract brand name
                        };
                    } else if (product.brand_id) {
                        // WHY: Fallback for cases where brand_id is just an ID
                        // PURPOSE: Try to get brand from POS store by ID
                        const brand = this.pos.get_product_brand_by_id(product.brand_id);
                        if (brand) {
                            line.brand_id = brand;
                        }
                    }
                    
                    // WHY: Add other custom product fields to receipt line
                    // PURPOSE: Make all custom product data available in receipt
                    line.custom_code = product.custom_code || '';
                    line.quality_grade = product.quality_grade || '';
                    line.is_featured = product.is_featured || false;
                }
                return line;
            });
        }

        // WHY: Console log for debugging receipt data
        // PURPOSE: Helps developers verify receipt data contains expected custom fields
        console.log('Enhanced receipt data with custom order number:', result);
        return result;
    }
});
```

**Code Explanation:**

1. **Patching Strategy**:
   - Uses `patch()` to extend existing Order model without replacing it
   - Preserves all existing POS order functionality
   - Adds custom functionality on top of standard behavior

2. **Data Persistence Methods**:
   - **`init_from_JSON()`**: Called when loading saved orders from database
   - **`export_as_JSON()`**: Called when saving orders to database
   - Both ensure custom fields survive page refreshes and order syncing

3. **API Design Pattern**:
   - Separate getter/setter methods for each custom field
   - Consistent naming convention: `get_*()` and `set_*()`
   - Always return default values to prevent undefined errors

4. **Reprint Support**:
   - **`init_from_ui_order_data()`**: Handles backend data during reprinting
   - **`export_for_printing()`**: Includes custom fields in receipt data
   - Ensures reprinted receipts match original receipts

5. **Brand Data Enhancement**:
   - Processes Many2one field format `[id, name]`
   - Fallback to POS store lookup if needed
   - Adds brand data to each receipt line item

6. **Error Prevention**:
   - Default values (`|| ''`, `|| 'normal'`) prevent undefined errors
   - Optional chaining and existence checks
   - Graceful handling of missing data

7. **Why These Specific Methods**:
   - **`init_from_JSON/export_as_JSON`**: Core persistence cycle
   - **`export_for_printing`**: Receipt generation hook
   - **`init_from_ui_order_data`**: Reprint data loading hook
   - These are the key points where order data flows in POS system

### Step 3: Create Input Popup

```javascript
// static/src/js/custom_order_number_popup.js
/** @odoo-module */

// WHY: Import AbstractAwaitablePopup as base class for popup components
// PURPOSE: Provides standard popup behavior (positioning, backdrop, animation)
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";

// WHY: Import translation function for internationalization
// PURPOSE: Allows popup text to be translated to different languages
import { _t } from "@web/core/l10n/translation";

// WHY: Import OWL reactive hooks for component state management
// PURPOSE: useState for reactive data, useRef for DOM element access, onMounted for lifecycle
import { useState, useRef, onMounted } from "@odoo/owl";

// WHY: Export class to make it available for import in other modules
// PURPOSE: Allows ProductScreen and other components to use this popup
export class CustomOrderNumberPopup extends AbstractAwaitablePopup {
    // WHY: Define template name that matches XML template
    // PURPOSE: Links this JavaScript class to its corresponding XML template
    static template = "custom_pos.CustomOrderNumberPopup";
    
    // WHY: Define default properties with translations
    // PURPOSE: Provides default text that can be overridden when popup is called
    static defaultProps = {
        confirmText: _t('Confirm'),        // Button text
        cancelText: _t('Cancel'),          // Button text
        title: _t('Set Custom Order Number'),  // Popup title
        body: _t('Enter a custom order number for this order:'),  // Instructions
        startingValue: "",                 // Default input value
    };

    // WHY: setup() method is OWL component lifecycle hook
    // PURPOSE: Initialize component state and references when popup is created
    setup() {
        // WHY: Call parent setup to inherit AbstractAwaitablePopup functionality
        // PURPOSE: Ensures popup positioning, backdrop, and base behavior work correctly
        super.setup();
        
        // WHY: useState creates reactive state object
        // PURPOSE: When inputValue changes, UI automatically updates
        this.state = useState({ 
            inputValue: this.props.startingValue || '' 
        });
        
        // WHY: useRef creates reference to DOM input element
        // PURPOSE: Allows direct access to input for focusing and value manipulation
        this.inputRef = useRef("input");
        
        // WHY: onMounted lifecycle hook runs after component is rendered
        // PURPOSE: Focus input field when popup appears for better UX
        onMounted(this.onMounted);
    }

    // WHY: onMounted callback method
    // PURPOSE: Automatically focus input when popup opens (better user experience)
    onMounted() {
        this.inputRef.el.focus();
    }

    // WHY: getPayload method returns data when popup is confirmed
    // PURPOSE: AbstractAwaitablePopup calls this to get the result value
    getPayload() {
        return this.state.inputValue;
    }
}
```

**Code Explanation:**

1. **Component Architecture**:
   - Extends `AbstractAwaitablePopup` for consistent popup behavior
   - Uses OWL framework patterns (reactive state, refs, lifecycle hooks)
   - Separates JavaScript logic from XML template

2. **State Management**:
   - `useState`: Creates reactive state that automatically updates UI
   - `useRef`: Direct DOM access for input field manipulation
   - State changes trigger automatic re-rendering

3. **Popup Lifecycle**:
   - `setup()`: Component initialization
   - `onMounted()`: Post-render actions (focusing input)
   - `getPayload()`: Return value when confirmed

4. **Why This Pattern**:
   - Reusable popup component for any input scenario
   - Consistent with Odoo POS popup architecture
   - Proper internationalization support
   - Automatic state management and UI updates

5. **User Experience Considerations**:
   - Auto-focus input for immediate typing
   - Default props for consistent behavior
   - Translation support for global deployment

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
    <!-- WHY: t-inherit="point_of_sale.OrderReceipt" extends existing receipt template -->
    <!-- PURPOSE: Modify receipt layout without replacing entire template -->
    <t t-name="point_of_sale.OrderReceipt" t-inherit="point_of_sale.OrderReceipt" t-inherit-mode="extension">
        
        <!-- WHY: XPath targets specific location in existing template -->
        <!-- PURPOSE: Add custom order fields after standard order data section -->
        <xpath expr="//div[hasclass('pos-receipt-order-data')]" position="inside">
            
            <!-- Custom Order Number Section -->
            <!-- WHY: t-if conditional rendering prevents empty sections -->
            <!-- PURPOSE: Only show custom order number if it exists -->
            <t t-if="props.data.custom_order_number">
                <div class="pos-receipt-custom-order-number" style="font-weight: bold; margin-bottom: 5px;">
                    <!-- WHY: t-esc safely escapes HTML to prevent XSS attacks -->
                    <!-- PURPOSE: Display custom order number securely -->
                    Custom Order #: <t t-esc="props.data.custom_order_number"/>
                </div>
            </t>
            
            <!-- Priority Section -->
            <!-- WHY: Check priority exists and is not default 'normal' value -->
            <!-- PURPOSE: Only show priority when it's been changed from default -->
            <t t-if="props.data.priority and props.data.priority != 'normal'">
                <div class="pos-receipt-priority" style="margin-bottom: 5px;">
                    <!-- WHY: toUpperCase() makes priority more prominent on receipt -->
                    <!-- PURPOSE: Clear visual indication of urgent/high priority orders -->
                    Priority: <t t-esc="props.data.priority.toUpperCase()"/>
                </div>
            </t>
            
            <!-- Delivery Date Section -->
            <!-- WHY: Only show delivery date if customer specified one -->
            <!-- PURPOSE: Avoid cluttering receipt with empty delivery dates -->
            <t t-if="props.data.requested_delivery_date">
                <div class="pos-receipt-delivery-date" style="margin-bottom: 5px;">
                    Delivery Date: <t t-esc="props.data.requested_delivery_date"/>
                </div>
            </t>
            
            <!-- Special Instructions Section -->
            <!-- WHY: Instructions need special styling to stand out -->
            <!-- PURPOSE: Important customer requests must be clearly visible -->
            <t t-if="props.data.special_instructions">
                <div class="pos-receipt-instructions" style="margin-bottom: 10px; font-style: italic;">
                    Instructions: <t t-esc="props.data.special_instructions"/>
                </div>
            </t>
        </xpath>
        
        <!-- WHY: Replace entire orderlines section to add product custom fields -->
        <!-- PURPOSE: Show brand, custom codes, and quality info for each product -->
        <xpath expr="//OrderWidget" position="replace">
            <div class="orderlines">
                <!-- WHY: t-foreach loops through each order line -->
                <!-- PURPOSE: Process each product line individually for custom field display -->
                <t t-foreach="props.data.orderlines" t-as="line" t-key="line_index">
                    <div class="pos-receipt-orderline">
                        
                        <!-- Product Quantity and Name Section -->
                        <div class="pos-receipt-left-align">
                            <!-- WHY: Show quantity first (standard receipt format) -->
                            <!-- PURPOSE: Follows familiar receipt layout expectations -->
                            <t t-esc="line.qty"/>
                            
                            <!-- WHY: Show unit if not default 'Units' -->
                            <!-- PURPOSE: Important for weight-based or measured products -->
                            <t t-if="line.unit !== 'Units'">
                                <t t-esc="line.unit"/>
                            </t>
                            
                            <!-- WHY: Product name is main identifier -->
                            <!-- PURPOSE: Core product information customer needs -->
                            x <t t-esc="line.productName"/>
                            
                            <!-- Brand Information Display -->
                            <!-- WHY: Brand shown in parentheses with different styling -->
                            <!-- PURPOSE: Additional product info without overwhelming main text -->
                            <t t-if="line.brand_name">
                                <span style="color: #666; font-style: italic;"> (<t t-esc="line.brand_name"/>)</span>
                            </t>
                            
                            <!-- Custom Product Code -->
                            <!-- WHY: Smaller font size for secondary information -->
                            <!-- PURPOSE: Internal tracking code for staff reference -->
                            <t t-if="line.custom_code">
                                <br/><span style="font-size: 0.8em; color: #666;">Code: <t t-esc="line.custom_code"/></span>
                            </t>
                            
                            <!-- Quality Grade Display -->
                            <!-- WHY: Only show if not standard grade (avoid clutter) -->
                            <!-- PURPOSE: Important for premium/economy product differentiation -->
                            <t t-if="line.quality_grade and line.quality_grade != 'standard'">
                                <br/><span style="font-size: 0.8em; color: #666;">Grade: <t t-esc="line.quality_grade"/></span>
                            </t>
                            
                            <!-- Featured Product Badge -->
                            <!-- WHY: Golden badge styling makes featured products stand out -->
                            <!-- PURPOSE: Marketing highlight for promoted products -->
                            <t t-if="line.is_featured">
                                <span style="background: gold; color: black; padding: 2px 4px; font-size: 0.7em; border-radius: 3px; margin-left: 5px;">FEATURED</span>
                            </t>
                        </div>
                        
                        <!-- Price Section -->
                        <!-- WHY: Right-aligned for traditional receipt format -->
                        <!-- PURPOSE: Clear price display following receipt conventions -->
                        <div class="pos-receipt-right-align">
                            <t t-esc="line.price"/>
                        </div>
                        
                        <!-- Customer Note Section -->
                        <!-- WHY: Indented and styled differently from product info -->
                        <!-- PURPOSE: Customer-specific requests clearly separated -->
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

**Code Explanation:**

1. **Template Inheritance Strategy**:
   - `t-inherit`: Extends existing receipt without replacing it
   - `t-inherit-mode="extension"`: Adds to existing template rather than replacing
   - XPath targeting: Precisely places custom content in specific locations

2. **Conditional Rendering Pattern**:
   - `t-if`: Only renders elements when data exists
   - Prevents empty sections and cluttered receipts
   - Improves receipt readability and professionalism

3. **XPath Positioning**:
   - `position="inside"`: Adds content within existing element
   - `position="replace"`: Replaces existing content entirely
   - Precise targeting prevents layout conflicts

4. **Styling Considerations**:
   - Inline styles for receipt-specific formatting
   - Color coding (`#666`) for secondary information
   - Font sizes to create information hierarchy
   - Margin/padding for visual separation

5. **Data Access Pattern**:
   - `props.data.fieldname`: Access order-level custom fields
   - `line.fieldname`: Access product-level custom fields
   - Data comes from `export_for_printing()` method

6. **Security Measures**:
   - `t-esc`: Escapes HTML to prevent XSS attacks
   - Safe rendering of user-provided content
   - Essential for production environments

7. **User Experience Design**:
   - Information hierarchy (main text → secondary info → badges)
   - Visual separation between different data types
   - Consistent spacing and alignment
   - Clear labeling for all custom fields

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

## Code Explanation Reference

### Python Backend Code Patterns

#### Model Inheritance
```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'  # Extends existing model
```
**Why**: Extends existing functionality without breaking standard Odoo features. Adds fields to existing database table.

#### Field Type Selection
```python
brand_id = fields.Many2one('product.brand')    # Relationship field
custom_code = fields.Char()                    # Short text
priority = fields.Selection([...])             # Dropdown options
active = fields.Boolean(default=True)          # True/false flag
```
**Why**: Different field types serve different purposes:
- Many2one: Links to other records
- Char: Limited text (codes, names)
- Selection: Standardized options
- Boolean: Simple flags

#### Computed Fields
```python
@api.depends('name')
def _compute_product_count(self):
    for record in self:
        record.product_count = self.env['model'].search_count([...])
```
**Why**: Automatically calculated fields that update when dependencies change. More efficient than manual calculations.

#### POS Data Loading
```python
def _loader_params_model_name(self):
    return {'search_params': {'fields': [...], 'domain': [...]}}
```
**Why**: Controls what data gets sent to POS browser interface. Minimizes data transfer and memory usage.

#### Order Field Handling
```python
def _order_fields(self, ui_order):
    fields = super()._order_fields(ui_order)
    if 'custom_field' in ui_order:
        fields['custom_field'] = ui_order['custom_field']
    return fields
```
**Why**: Bridges POS frontend data to backend database. Essential for saving custom fields from UI.

### JavaScript Frontend Code Patterns

#### Module Import and Patching
```javascript
import { Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Order.prototype, {
    // Custom methods here
});
```
**Why**: OWL framework pattern for extending existing functionality without replacing it. Preserves core POS behavior.

#### Data Persistence Methods
```javascript
init_from_JSON(json) {
    super.init_from_JSON(json);
    this.custom_field = json.custom_field || '';
}

export_as_JSON() {
    const json = super.export_as_JSON();
    json.custom_field = this.custom_field || '';
    return json;
}
```
**Why**: These methods handle order data loading/saving cycle. Essential for data persistence across page refreshes.

#### Receipt Data Preparation
```javascript
export_for_printing() {
    const result = super.export_for_printing();
    result.custom_field = this.custom_field || '';
    return result;
}
```
**Why**: Prepares data specifically for receipt templates. Includes custom fields in receipt rendering context.

#### Reprint Data Handling
```javascript
init_from_ui_order_data(order_data) {
    if (super.init_from_ui_order_data) {
        super.init_from_ui_order_data(order_data);
    }
    if (order_data.custom_field) {
        this.custom_field = order_data.custom_field;
    }
}
```
**Why**: Handles data from backend when reprinting receipts. Ensures reprinted receipts match originals.

### XML Template Code Patterns

#### View Inheritance
```xml
<record id="view_custom" model="ir.ui.view">
    <field name="inherit_id" ref="module.original_view"/>
    <field name="arch" type="xml">
        <xpath expr="//field[@name='existing_field']" position="after">
            <field name="custom_field"/>
        </xpath>
    </field>
</record>
```
**Why**: Extends existing views without modifying core files. Ensures upgrades don't break customizations.

#### Receipt Template Inheritance
```xml
<t t-name="point_of_sale.OrderReceipt" t-inherit="point_of_sale.OrderReceipt" t-inherit-mode="extension">
    <xpath expr="//div[hasclass('pos-receipt-order-data')]" position="inside">
        <t t-if="props.data.custom_field">
            Custom Field: <t t-esc="props.data.custom_field"/>
        </t>
    </xpath>
</t>
```
**Why**: QWeb template inheritance allows customizing receipts while preserving standard functionality.

#### Popup Component Template
```xml
<t t-name="custom_pos.CustomPopup">
    <div class="popup">
        <input t-ref="input" t-model="state.inputValue"/>
        <div class="button confirm" t-on-click="confirm">Confirm</div>
    </div>
</t>
```
**Why**: OWL component template structure with reactive state binding and event handling.

### Common Code Patterns and Their Purposes

#### Error Prevention
```python
# Python
if field in ui_order:
    fields[field] = ui_order[field]

# JavaScript  
this.custom_field = json.custom_field || '';
```
**Why**: Prevents errors when data is missing or undefined. Essential for robust applications.

#### Data Validation
```python
@api.depends('name')
def _compute_field(self):
    for record in self:
        # Validation logic here
```
**Why**: Ensures data integrity and business rule compliance.

#### Performance Optimization
```python
# Load only needed fields
'fields': ['name', 'description']  # Not all fields

# Use search_count instead of len(search())
count = self.env['model'].search_count([domain])
```
**Why**: Reduces memory usage and improves loading speed, especially important in POS.

#### Modular Design
```javascript
// Separate methods for each field
set_custom_field(value) { this.custom_field = value; }
get_custom_field() { return this.custom_field || ''; }
```
**Why**: Clean API design makes code maintainable and easier to debug.

This reference guide explains the reasoning behind every code pattern used in the implementation, helping developers understand not just what to write, but why each piece of code is necessary.

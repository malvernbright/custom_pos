/** @odoo-module */

import { Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Order.prototype, {
    init_from_JSON(json) {
        super.init_from_JSON(json);
        this.custom_order_number = json.custom_order_number || '';
    },

    export_as_JSON() {
        const json = super.export_as_JSON();
        json.custom_order_number = this.custom_order_number || '';
        return json;
    },

    set_custom_order_number(custom_order_number) {
        this.custom_order_number = custom_order_number;
    },

    get_custom_order_number() {
        return this.custom_order_number || '';
    },

    // Handle data from backend for reprinting
    init_from_ui_order_data(order_data) {
        if (super.init_from_ui_order_data) {
            super.init_from_ui_order_data(order_data);
        }
        if (order_data.custom_order_number) {
            this.custom_order_number = order_data.custom_order_number;
        }
    },

    export_for_printing() {
        const result = super.export_for_printing();
        result.custom_order_number = this.custom_order_number || '';

        // Enhance orderlines with brand information (keeping existing functionality)
        if (result.orderlines) {
            result.orderlines = result.orderlines.map(line => {
                // Find the original orderline from this order
                const orderLine = this.orderlines.find(ol =>
                    ol.get_product().id === line.product_id ||
                    ol.get_full_product_name() === line.productName
                );

                if (orderLine && orderLine.get_product().brand_id) {
                    const product = orderLine.get_product();
                    if (Array.isArray(product.brand_id)) {
                        line.brand_id = {
                            id: product.brand_id[0],
                            name: product.brand_id[1]
                        };
                    } else if (product.brand_id) {
                        // Try to get brand from pos store
                        const brand = this.pos.get_product_brand_by_id(product.brand_id);
                        if (brand) {
                            line.brand_id = brand;
                        }
                    }
                }
                return line;
            });
        }

        console.log('Enhanced receipt data with custom order number:', result);
        return result;
    }
});

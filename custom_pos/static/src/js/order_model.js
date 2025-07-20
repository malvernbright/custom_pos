/** @odoo-module */

import { Order } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Order.prototype, {
    export_for_printing() {
        const result = super.export_for_printing();

        // Enhance orderlines with brand information
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

        console.log('Enhanced receipt data:', result);
        return result;
    }
});
